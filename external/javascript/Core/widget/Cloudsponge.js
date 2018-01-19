(function ($) {
    $.widget("ui.ContactImporter", {
        _init: function () {
            this.eventPollingTimeout = 30000;
            this.pollEvents = true;
            this._ajaxUrl = '/ctl/Core/Cloudsponge';
            this.initComplete = new Array;

            $(this.element).dialog({
                position: 'center',
                autoOpen: true,
                dialogClass: "bsd-contactImporter-dialog",
                modal: true,
                draggable: true,
                width: 475
            });
            $(".bsd-contactImporter-dialog").find('a.ui-dialog-titlebar-close').unbind('click');
            $(".bsd-contactImporter-dialog").find('a.ui-dialog-titlebar-close').click($.proxy(function (e) {
                e.preventDefault();
                this.finish();
            }, this));

            $('.bsd-contactImporter-login')
                .bind('cancel', {widget: this}, function (e) {
                    e.data.widget._showServiceList();
                })
                .bind('login', {widget: this}, function (e, formData) {
                    var widget = e.data.widget;
                    widget.showLoader('Logging in...');
                    widget.pollEvents = true;
                    widget._postRequest(widget._ajaxUrl, formData, $.proxy(widget._postEvent, widget));
                });

            $(this.element).find('.bsd-contactImporter-link').bind('linkSelected', {widget: this}, function (e, service, requestType) {
                var widget = e.data.widget;
                $('.bsd-contactImporter-loading', widget.element).ContactImporterLoader('setLogo', 'bsd-contactImporter-' + service);
                $('.bsd-contactImporter-login', widget.element).ContactImporterLoginForm('setLogo', 'bsd-contactImporter-' + service);
                var params = {
                    'contactImporter-service': service,
                    'contactImporter-requestType': requestType
                };

                switch (requestType) {
                    case 1:
                        widget.showLogin(params);
                        break;
                    case 2:
                        widget.startUserConsent(params);
                        break;
                    case 4:
                        widget.startAppletImport(params);
                        break;
                }
            });

            $("input#bsd-contactImporter-load").unbind('click');
            $("input#bsd-contactImporter-load").click($.proxy(function (e) {
                e.preventDefault();
                var emails = new Array;
                var contacts = $('.bsd-contactImporter-addContact:checked').each(function () {
                    emails.push($(this).val());
                });

                existingVal = $('#' + this.options.textareaId).val();

                if (existingVal) {
                    var toVal = existingVal + ', ' + emails.join(', ');
                } else {
                    var toVal = emails.join(', ');
                }

                $('#' + this.options.textareaId).val(toVal);
                this.finish();
            }, this));
        },

        finish: function () {
            this.hideLogin();
            this.hideContacts();
            this.hideLoader();
            this._showServiceList();
            $(this.element).find('.bsd-contactImporter-loadContactsButton').hide();

            $(this.element).dialog('destroy');
            $(".bsd-datatable").BlueDataTable('destroy');
            this.destroy();
        },

        startAppletImport: function (postParams) {
            this.showLoader('Allow Applet');
            this._postRequest(this._ajaxUrl, postParams, $.proxy(this.addApplet, this));
        },

        addApplet: function (r) {
            $(this.element).find('#cs_container_frame').html(r.html);
            this.pollEvents = true;
            this.importId = r['contactImporter-importId'];
            this._postEvent({
                'contactImporter-requestType': 3,
                'contactImporter-importId': r['contactImporter-importId']
            });
        },

        startUserConsent: function (postParams) {
            this.showLoader('Sign in');
            this.pollEvents = true;
            var queryStr = "?contactImporter-requestType=" + postParams['contactImporter-requestType'] + "&contactImporter-service=" + postParams['contactImporter-service'];
            this.userConsentWindow = window.open(this._ajaxUrl + queryStr, 'userConsent', 'location=no,status=no,toolbar=no,width=600,height=400');
            this.pollId = window.setInterval($.proxy(this.userConsentWindowPoller, this), 1);

            $(window.document).bind('bsdPopupObserverEvent', [], $.proxy(function (e, popupResponse) {
                this.importId = popupResponse.import_id;
                this.userConsentWindow.location = popupResponse.url;
            }, this));

            $(this.element).find('a.signInLink').click($.proxy(function (e) {
                e.preventDefault();
                this.userConsentWindow.focus();
            }, this));
        },

        hideLoader: function () {
            var loader = $('.bsd-contactImporter-loading', this.element);
            loader.ContactImporterLoader('hide');
        },

        showLoader: function (loaderMsg) {
            var loader = $('.bsd-contactImporter-loading', this.element);
            loader.ContactImporterLoader('setMessage', loaderMsg);
            loader.ContactImporterLoader('show');
            this._hideServiceList();
            this.hideLogin();
        },

        hideLoader: function () {
            $(this.element).find('.bsd-contactImporter-loading').hide();
        },

        showLogin: function (loginParams) {
            var loginForm = $('.bsd-contactImporter-login', this.element);

            if (loginParams) {
                loginForm.ContactImporterLoginForm('setService', loginParams['contactImporter-service']);
                loginForm.ContactImporterLoginForm('setRequestType', loginParams['contactImporter-requestType']);
            }

            loginForm.ContactImporterLoginForm('show');
            this._hideServiceList();
        },

        _postRequest: function (postUrl, postParams, successCallback) {
            postParams.importType = this.importType;

            $.post(postUrl, postParams,
                $.proxy(function (r) {
                    this.importId = r['contactImporter-importId'];
                    successCallback(r);
                }, this),
                'json'
            );
        },

        userConsentWindowPoller: function () {
            if (this.userConsentWindow.closed) {
                window.clearInterval(this.pollId);
                this._postEvent({'contactImporter-requestType': 3, 'contactImporter-importId': this.importId});
                return;
            }

            return;
        },

        _postEvent: function (postParams) {
            if (!this.hasTimedout() && this.pollEvents) {
                this._postRequest('/ctl/Core/CloudspongeEvent', postParams, $.proxy(this._checkEventStatus, this));
            }
        },

        hasTimedout: function () {
            return this.getCurrentTime() - this.startTime >= this.eventPollingTimeout;
        },

        startTimer: function () {
            this.timerStarted = true;
            this.startTime = Number(new Date());
        },

        getCurrentTime: function () {
            return Number(new Date());
        },

        _checkEventStatus: function (r) {
            if (r.initComplete) {
                this.initComplete[this.importId] = true;
            }

            if (r.status == 'failure') {
                this.pollEvents = false;
                this.hideLoader();
                this._hideServiceList();
                $('.bsd-contactImporter-dialog').hide();
                $('#contact_importer_button').html("Import service is unavailable. Please try again later.").removeAttr("href");

                return;
            }

            if (r.consentFailed) {
                this.pollEvents = false;
                this.showLoader(r['contactImporter-userStatusMsg']);
                window.setTimeout($.proxy(function () {
                    this.hideLoader();
                    this._showServiceList();
                }, this), 3000);

                return;
            }

            if (r.loginFailed) {
                this.pollEvents = false;
                this.hideLoader();
                $('.bsd-contactImporter-login', this.element)
                    .ContactImporterLoginForm('show')
                    .ContactImporterLoginForm('showError', r['contactImporter-userStatusMsg']);

                return;
            }

            if (r.raw.importType == 4 && r.errors) {
                this.showLoader(r['contactImporter-userStatusMsg']);
            }

            if (!this.initComplete[this.importId] && r.raw.importType != 4 && (!r.raw.events || r.raw.events.length == 0)) {
                this.pollEvents = false;
                this.hideLoader();
                this._showServiceList();

                return;
            }

            if (!this.timerStarted) {
                this.startTimer();
            }

            if (r.contactsReady) {
                this.hideLoader();
                this._getContacts(r);
            } else {
                this._postEvent(r);
            }

            return;
        },

        _getContacts: function (postParams) {
            this.showLoader('Importing Contacts');
            this._postRequest('/ctl/Core/CloudspongeContacts', postParams, $.proxy(this._addContactsToForm, this));
        },

        _addContactsToForm: function (response) {
            $(this.element).find('.bsd-contactImporter-contacts').html(response.html);
            $(this.element).find('.bsd-contactImporter-login').hide();
            this._hideServiceList();
            this.hideLoader();
            $(this.element).find('.bsd-contactImporter-loadContactsButton').show();

            (function ($) {
                window.jQuery = $;
                $(".bsd-datatable").BlueDataTable();
                $("div.bsd-datatable").before("<div class='clear'></div><div><a href='#' class='bsd-contactImporter-allLink'>All</a>&nbsp;&nbsp;<a href='#' class='bsd-contactImporter-noneLink'>None</a></div>");

                $("a.bsd-contactImporter-allLink").click(function (e) {
                    e.preventDefault();
                    $('.bsd-contactImporter-addContact').attr('checked', true);
                });

                $("a.bsd-contactImporter-noneLink").click(function (e) {
                    e.preventDefault();
                    $('.bsd-contactImporter-addContact').attr('checked', false);
                });
            })($);
            this.showContacts();
        },

        setLoadingMsg: function (Msg) {
            $(this.element).find('.bsd-contactImporter-loading .loadingMessage').html(Msg);
        },

        showLoadingMsg: function () {
            $(this.element).find('.bsd-contactImporter-loading .loadingMessage').show();
        },

        _hideServiceList: function () {
            $(this.element).find('.bsd-contactImporter-list').hide();
        },

        _showServiceList: function () {
            $(this.element).find('.bsd-contactImporter-list').show();
        },

        hideContacts: function () {
            $(this.element).find('.bsd-contactImporter-contacts').hide();
        },

        showContacts: function () {
            $(this.element).find('.bsd-contactImporter-contacts').show();
            $(this.element).find("#contactImporter-contactsTable").show();
        },

        hideLogin: function () {
            $('.bsd-contactImporter-login', this.element).ContactImporterLoginForm('hide');
        }
    });
})(window.bQuery || window.jQuery);
