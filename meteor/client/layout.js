/*
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.
Copyright (c) 2014 Mozilla Corporation
*/
import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

if (Meteor.isClient) {
    //events that could fire in any sub template
    Template.layout.events({
        "click .ipmenu-copy": function(e,t){
            var ipText=$(e.target).attr('data-ipaddress')
            var ipTextArea = document.createElement("textarea");
            ipTextArea.value = ipText;
            e.target.appendChild(ipTextArea);
            ipTextArea.focus();
            ipTextArea.select();
            try {
              var successful = document.execCommand('copy');
              var msg = successful ? 'successful' : 'unsuccessful';
              Session.set('displayMessage','copy & '+ msg);
            } catch (err) {
                Session.set('errorMessage','copy failed & ' + JSON.stringify(err));
            }
            e.target.removeChild(ipTextArea);
        },
        "click .ipmenu-whois": function(e,t){
            Session.set('ipwhoisipaddress',($(e.target).attr('data-ipaddress')));
            $('#modalwhoiswindow').modal()
        },
        "click .ipmenu-dshield": function(e,t){
            Session.set('ipdshieldipaddress',($(e.target).attr('data-ipaddress')));
            $('#modaldshieldwindow').modal()
        },
        "click .ipmenu-blockip": function(e,t){
            Session.set('blockIPipaddress',($(e.target).attr('data-ipaddress')));
            $('#modalBlockIPWindow').modal()
        },
        "click .ipmenu-intel": function(e,t){
            Session.set('ipintelipaddress',($(e.target).attr('data-ipaddress')));
            $('#modalintelwindow').modal()
        },
        "click .dropdown": function(e,t){
            $(e.target).addClass("hover");
            $('ul:first',$(e.target)).css('visibility', 'visible');
        }
    });

    Template.layout.rendered=function(){
    // Intercepts all XHRs and reload the main browser window on redirect or request error (such as CORS denying access)
        // This is because, if you run MozDef behind an access-proxy, the requests maybe 302'd to an authentication
        // provider, but Meteor does not know or handle this. Reloading the main browser window will send the user to the
        // authentication provider correctly and follow the 302.
        // Note that since they're 302's they will ALWAYS cause a CORS error, which we keep as this is the SAFE way to
        // handle this situation.
        (function(xhr) {
            var authenticationType = getSetting('authenticationType').toLowerCase();
            function intercept_xhr(xhrInstance) {
                // Verify a user is actually logged in and Meteor is running
                if ((Meteor.user() !== null) && (Meteor.status().connected)) {
                    // Status 0 means the request failed (CORS denies access)
                    if (xhrInstance.readyState == 4 && (xhrInstance.status == 302 || xhrInstance.status == 0)) {
                            location.reload();
                    }
                }
            }
            var send = xhr.send;
            xhr.send = function(data) {
                var origFunc = this.onreadystatechange;
                if (origFunc) {
                    this.onreadystatechange = function() {
                        // We only start hooking for oidc authentication, as this is the only method that is currently
                        // REQUIRING an access proxy and thus likely to run into 302s
                        if (authenticationType == 'oidc'){
                            intercept_xhr(this);
                        }
                        return origFunc.apply(this, arguments);
                    };
                }
                return send.apply(this, arguments);
            };
        })(XMLHttpRequest.prototype);
    }
}
