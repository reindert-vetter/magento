MyParcel = {
    /*
     * Init
     *
     * Initialize the MyParcel checkout.
     *
     */
    data: {},
    currentLocation: {},


    setMagentoDataAndInit: function () {
        var ajaxOptions = {
            url: BASE_URL + 'myparcel2014/checkout/info/?ran=' + Math.random(),
            success: function (response) {

                data = response.data;

                price = [];

                price['default'] = '&#8364; ' + data.general['base_price'].toFixed(2).replace(".", ",");

                if (data.pickup['fee'] != 0) {
                    price['pickup'] = '&#8364; ' + data.pickup['fee'].toFixed(2).replace(".", ",");
                }

                if (data.delivery['signature_active'] == false) {
                    price['signed'] = 'disabled';
                } else if (data.delivery['signature_fee'] !== 0) {
                    price['signed'] = '+ &#8364; ' + data.delivery['signature_fee'].toFixed(2).replace(".", ",");
                }

                /**
                 * Exclude delivery types
                 */
                excludeDeliveryTypes = [];

                if (data.pickup['active'] == false) {
                    excludeDeliveryTypes.push('4');
                }

                var address = data['address'];
                console.log(address);
                if (address && (address['country'] === 'NL' || (address['country'] === 'BE'))) {

                    if (address['street']) {
                        myParcelConfig = {
                            address: {
                                cc: address['country'],
                                street: address['street'],
                                number: address['number'],
                                postalCode: address['postal_code'].replace(/ /g, ""),
                                city: address['city']
                            },
                            txtWeekDays: [
                                'Zondag',
                                'Maandag',
                                'Dinsdag',
                                'Woensdag',
                                'Donderdag',
                                'Vrijdag',
                                'Zaterdag'
                            ],
                            translateENtoNL: {
                                'monday': 'maandag',
                                'tuesday': 'dindsag',
                                'wednesday': 'woensdag',
                                'thursday': 'donderdag',
                                'friday': 'vrijdag',
                                'saturday': 'zaterdag',
                                'sunday': 'zondag'
                            },
                            config: {
                                "apiBaseUrl": "https://api.myparcel.nl/",
                                "carrier": "1",

                                "priceMorningDelivery": data.morningDelivery['fee'],
                                "priceNormalDelivery":  data.general['base_price'],
                                "priceEveningDelivery": data.eveningDelivery['fee'],
                                "priceSignature": data.delivery['signature_fee'],
                                "pricePickup": data.pickup['fee'],
                                "pricePickupExpress": data.pickupExpress['fee'],
                                "priceOnlyRecipient": data.delivery['only_recipient_fee'],

                                "deliveryMorningTitel":"Ochtendlevering",
                                "deliveryStandardTitel":"Standaard levering",
                                "deliveryEveningTitel":"Avondlevering",

                                "allowMondayDelivery": data.general['monday_delivery_active'] ? 1 : 0,
                                "allowMorningDelivery": data.morningDelivery['active'],
                                "allowEveningDelivery": data.eveningDelivery['active'],
                                "allowSignature": data.delivery['signature_active'],
                                "allowOnlyRecipient": data.delivery['only_recipient_active'],
                                "allowPickupPoints": data.pickup['active'],

                                "dropOffDays": data.general['dropoff_days'],
                                "saturdayCutoffTime": data.general['saturday_cutoff_time'],
                                "cutoffTime": data.general['cutoff_time'],
                                "deliverydaysWindow": data.general['deliverydays_window']
                            }
                        }


                        MyParcel.init(myParcelConfig);

                    }
                }
            }
        };
        jQuery.ajax(ajaxOptions);
    },

    init: function(externalData)
    {
        this.data = externalData;
        if (mypajQuery('#s_method_myparcel_mailbox').length > 0) {
            return;
        }

        isMobile     = true;
        if(mypajQuery( window ).width() > 980 ) {
            isMobile = false;
        }

        /* Prices */
        mypajQuery('#mypa-morning-delivery').html(MyParcel.getPriceHtml(this.data.config.priceMorningDelivery));
        mypajQuery('#mypa-evening-delivery').html(MyParcel.getPriceHtml(this.data.config.priceEveningDelivery));
        mypajQuery('#mypa-normal-delivery').html(MyParcel.getPriceHtml(this.data.config.priceNormalDelivery));
        mypajQuery('#mypa-signature-price').html(MyParcel.getPriceHtml(this.data.config.priceSignature));
        mypajQuery('#mypa-only-recipient-price').html(MyParcel.getPriceHtml(this.data.config.priceOnlyRecipient));
        mypajQuery('#mypa-pickup-price').html(MyParcel.getPriceHtml(this.data.config.pricePickup));

        /* Call delivery options */
        MyParcel.callDeliveryOptions();

        /* Engage defaults */
        MyParcel.hideDelivery();
        mypajQuery('#method-myparcel-normal').click();

        MyParcel.bind();
    },

    getPriceHtml: function(priceOfDeliveryOption){

        if (!priceOfDeliveryOption) {
            var price = "";
        }

        if (parseFloat(priceOfDeliveryOption) >= 0){
            var price = '( + &euro; ' + priceOfDeliveryOption + ' )' ;
        }

        if (priceOfDeliveryOption && isNaN(parseFloat(priceOfDeliveryOption))){
            var price = '( ' + priceOfDeliveryOption + ' )' ;
        }

        return price;
    },

    setCurrentDeliveryOptions: function () {
        if (typeof MyParcel.storeDeliveryOptions === 'undefined') {
            console.error('setCurrentDeliveryOptions() MyParcel.storeDeliveryOptions === undefined');
            return;
        }

        var selectedDate 	= mypajQuery('#mypa-select-date').val();
        var selectDateKey 	=	MyParcel.storeDeliveryOptions.data.delivery[selectedDate]['time'];

        MyParcel.hideMorningDelivery();
        MyParcel.hideEveningDelivery();

        mypajQuery.each(selectDateKey, function(key, value){

            if(value['price_comment'] == 'morning' && MyParcel.data.config.allowMorningDelivery){
                var morningTitel = MyParcel.data.config.deliveryMorningTitel;
                MyParcel.getDeliveryTime(morningTitel,'morning', MyParcel.data.config.deliveryMorningTitel, value['start'], value['end']);
                MyParcel.showMorningDelivery();
            }
            if(value['price_comment'] == 'standard'){
                var standardTitel = MyParcel.data.config.deliveryStandardTitel;
                MyParcel.getDeliveryTime(standardTitel,'standard', MyParcel.data.config.deliveryStandardTitel, value['start'], value['end']);

            }
            if(value['price_comment'] == 'avond' && MyParcel.data.config.allowEveningDelivery){
                var eveningTitel = MyParcel.data.config.deliveryEveningTitel;
                MyParcel.getDeliveryTime(eveningTitel, 'evening', MyParcel.data.config.deliveryEveningTitel, value['start'], value['end'] );
                MyParcel.showEveningDelivery();
            }

        });

    },
    getDeliveryTime: function (configDeliveryTitel, deliveryMoment, deliveryTitel, startTime, endTime) {
        startTime = startTime.replace(/(.*)\D\d+/, '$1');
        endTime = endTime.replace(/(.*)\D\d+/, '$1');

        mypajQuery('#mypa-'+deliveryMoment+'-titel').html(deliveryTitel);

        if (!configDeliveryTitel){
            mypajQuery('#mypa-'+deliveryMoment+'-titel').html(startTime + ' - ' + endTime);
        }

    },

    setCurrentLocation: function () {
        var locationId 			= mypajQuery('#mypa-pickup-location').val();
        this.currentLocation 	= MyParcel.storeDeliveryOptions.data.pickup[locationId];
    },

    /*
     * Bind
     *
     * Bind actions to selectors.
     *
     */

    bind: function ()
    {
        mypajQuery('#mypa-submit').on('click', function(e)
        {
            e.preventDefault();
            MyParcel.exportDeliveryOptionToWebshop();
        });

        /* show default delivery options and hide PostNL options */
        mypajQuery('#mypa-select-delivery').on('click', function(){
            MyParcel.setCurrentDeliveryOptions();
            MyParcel.showDelivery();
            MyParcel.hidePickUpLocations();
        });

        /* hide default delivery options and show PostNL options */
        mypajQuery('#mypa-deliver-pickup-pickup').on('click', function(){
            MyParcel.hideDelivery();
            MyParcel.showPickUpLocations();
        });

        mypajQuery('#method-myparcel-delivery-morning, #method-myparcel-delivery-evening').on('click', function(){
            MyParcel.defaultCheckCheckbox('mypa-only-recipient');
        });

        /* Mobile specific triggers */
        if(isMobile){
            mypajQuery('#mypa-show-location-details').on('click', function(){
                MyParcel.setCurrentLocation();
                MyParcel.showLocationDetails();
            });
        }

        /* Desktop specific triggers */
        else {
            mypajQuery('#mypa-show-location-details').on('mouseenter', function(){
                MyParcel.setCurrentLocation();
                MyParcel.showLocationDetails();
            });
        }

        mypajQuery('#mypa-location-details').on('click', function(){
            MyParcel.hideLocationDetails();
        });

        mypajQuery('#method-myparcel-normal').on('click', function(){
            MyParcel.defaultCheckCheckbox('method-myparcel-normal');
        });

        mypajQuery('#mypa-pickup-express').hide();  /* todo: move */


        mypajQuery('#mypa-deliver-pickup-pickup, #mypa-pickup-location').on('change', function(e){
            MyParcel.setCurrentLocation();
            MyParcel.toggleDeliveryOptions();
        });

        mypajQuery('#mypa-select-date').on('change', function(e){
            MyParcel.setCurrentDeliveryOptions();
        });
    },

    /*
     * defaultCheckCheckbox
     *
     * Check the additional options that are required for certain delivery options
     *
     */
    defaultCheckCheckbox: function(selectedOption){
        if(selectedOption == 'mypa-only-recipient'){
            mypajQuery('#mypa-only-recipient-selector').prop('checked', true).prop({disabled: true});
            mypajQuery('#mypa-only-recipient-price').html(' (Inclusief)');
        } else {
            mypajQuery('#mypa-only-recipient-selector').prop('checked', false).removeAttr("disabled");
            mypajQuery('#mypa-only-recipient-price').html(MyParcel.getPriceHtml(this.data.config.priceOnlyRecipient));
        }
    },

    /*
     * toggleDeliveryOptions
     *
     * Shows and hides the display options that are valid for the recipient only and signature required pre-selectors
     *
     */

    toggleDeliveryOptions: function()
    {
        var isPickup	= mypajQuery('#mypa-deliver-pickup-pickup').is(':checked');

        if(isPickup && this.currentLocation.price_comment === "retailexpress"){
            mypajQuery('#mypa-pickup-express-price').html(MyParcel.getPriceHtml(this.data.config.pricePickupExpress));
            mypajQuery('#mypa-pickup-express').show();

        } else{
            mypajQuery('#mypa-pickup-express-selector').attr("checked", false);
            mypajQuery('#mypa-pickup-express').hide();

        }
    },


    /*
     * exportDeliverOptionToWebshop
     *
     * Exports the selected deliveryoption to the webshop.
     *
     */

    exportDeliveryOptionToWebshop: function()
    {
        var deliveryOption = "";
        var selected       = mypajQuery("#mypa-delivery-option-form").find("input[type='radio']:checked");
        if (selected.length > 0) {
            deliveryOption = selected.val();
        }

        /* XXX Send to appropriate webshop field */
    },


    /*
     * hideMessage
     *
     * Hides pop-up message.
     *
     */

    hideMessage: function()
    {
        mypajQuery('.mypa-massage-model').hide().html(' ');
        mypajQuery('#mypa-delivery-option-form').show();
    },

    /*
     * hideMessage
     *
     * Hides pop-up essage.
     *
     */

    showMessage: function(message)
    {
        mypajQuery('.mypa-massage-model').show();
        mypajQuery('#mypa-message').html(message).show();
        mypajQuery('#mypa-delivery-option-form').hide();

    },

    /*
     * hideDelivery
     *
     * Hides interface part for delivery.
     *
     */

    hideDelivery: function()
    {
        mypajQuery('#mypa-delivery-date').hide();
        mypajQuery('#mypa-pre-selectors-nl').hide();
        mypajQuery('#mypa-delivery').hide();
        MyParcel.hideSignature();
        MyParcel.hideOnlyRecipient();
        MyParcel.hideMorningDelivery();
        MyParcel.hideEveningDelivery();

    },

    /*
     * showDelivery
     *
     * Shows interface part for delivery.
     *
     */

    showDelivery: function()
    {
        mypajQuery('#mypa-pre-selectors-' +      this.data.address.cc.toLowerCase()).show();
        mypajQuery('#mypa-delivery-selectors-' + this.data.address.cc.toLowerCase()).show();
        mypajQuery('#mypa-delivery').show();
        mypajQuery('#mypa-delivery-date').show();

        MyParcel.hideSignature();
        if(this.data.config.allowSignature){
            MyParcel.showSignature();
        }

        MyParcel.hideOnlyRecipient();
        if(this.data.config.allowOnlyRecipient){
            MyParcel.showOnlyRecipient();
        }
    },

    /*
     * showSpinner
     *
     * Shows the MyParcel spinner.
     *
     */

    showSpinner: function()
    {
        mypajQuery('.mypa-massage-model').hide();
        mypajQuery('#mypa-spinner').show();
    },


    /*
     * hideSpinner
     *
     * Hides the MyParcel spinner.
     *
     */

    hideSpinner: function()
    {
        mypajQuery('#mypa-spinner').hide();
    },

    showMorningDelivery: function()
    {
        mypajQuery('#method-myparcel-delivery-morning-div').show();
    },

    hideMorningDelivery: function()
    {
        mypajQuery('#method-myparcel-delivery-morning-div').hide();
    },

    showEveningDelivery: function()
    {
        mypajQuery('#method-myparcel-delivery-evening-div').show();
    },

    hideEveningDelivery: function()
    {
        mypajQuery('#method-myparcel-delivery-evening-div').hide();
    },

    showSignature: function()
    {
        mypajQuery('.mypa-extra-delivery-option-signature, #mypa-signature-price').show();
    },

    hideSignature: function()
    {
        mypajQuery('.mypa-extra-delivery-option-signature, #mypa-signature-price').hide();
    },

    showOnlyRecipient: function()
    {
        mypajQuery('#mypa-only-recipient, #mypa-only-recipient-price').show();
    },

    hideOnlyRecipient: function()
    {
        mypajQuery('#mypa-only-recipient, #mypa-only-recipient-price').hide();
    },

    /*
     * dateToString
     *
     * Convert api date string format to human readable string format
     *
     */

    dateToString: function(apiDate)
    {
        var deliveryDate 	= apiDate;
        var dateArr      	= deliveryDate.split('-');
        var dateObj      	= new Date(dateArr[0],dateArr[1]-1,dateArr[2]);
        var day				= ("0" + (dateObj.getDate())).slice(-2);
        var month        	= ("0" + (dateObj.getMonth() + 1)).slice(-2);

        return this.data.txtWeekDays[dateObj.getDay()] + " " + day + "-" + month + "-" + dateObj.getFullYear();
    },

    /*
     * showDeliveryDates
     *
     * Show possible delivery dates.
     *
     */

    showDeliveryDates: function()
    {
        var html = "";

        mypajQuery.each(MyParcel.data.deliveryOptions.data.delivery, function(key, value){
            html += '<option value="' + key + '">' + MyParcel.dateToString(value.date) + ' </option>\n';
        });
        mypajQuery('#mypa-select-date').html(html);
    },

    hideDeliveryDates: function()
    {
        mypajQuery('#mypa-delivery-date').parent().hide();
    },

    /*
     * clearPickupLocations
     *
     * Clear pickup locations and show a non-value option.
     *
     */

    clearPickUpLocations: function()
    {
        var html = '<option value="">---</option>';
        mypajQuery('#mypa-pickup-location').html(html);
    },


    /*
     * hidePickupLocations
     *
     * Hide the pickup location option.
     *
     */

    hidePickUpLocations: function()
    {
        if(!MyParcel.data.config.allowPickupPoints) {
            mypajQuery('#mypa-pickup-location-selector').hide();
        }

        mypajQuery('#mypa-pickup-options, #mypa-pickup, #mypa-pickup-express').hide();

    },


    /*
     * showPickupLocations
     *
     * Shows possible pickup locations, from closest to furdest.
     *
     */

    showPickUpLocations: function()
    {
        if(MyParcel.data.config.allowPickupPoints) {

            var html = "";
            mypajQuery.each(MyParcel.data.deliveryOptions.data.pickup, function (key, value) {
                var distance = parseFloat(Math.round(value.distance) / 1000).toFixed(2);
                html += '<option value="' + key + '">' + value.location + ', ' + value.street + ' ' + value.number + ", " + value.city + " (" + distance + " KM) </option>\n";
            });
            mypajQuery('#mypa-pickup-location').html(html).prop("checked", true);
            mypajQuery('#mypa-pickup-location-selector, #mypa-pickup-options, #mypa-pickup').show();
        }
    },

    /*
     * hideLocationDetails
     *
     * Hide the detailed information pop-up for selected location.
     *
     */

    hideLocationDetails: function()
    {
        mypajQuery('#mypa-location-details').hide();
    },

    /*
     * showLocationDetails
     *
     * Shows the detailed information pop-up for the selected pick-up location.
     */

    showLocationDetails: function()
    {
        var html       		= "";
        var startTime		= this.currentLocation.start_time;

        /* Strip seconds if present */
        if(startTime.length > 5){
            startTime = startTime.slice(0,-3);
        }

        html += '<svg  class="svg-inline--fa mypa-fa-times fa-w-12" aria-hidden="true" data-prefix="fas" data-icon="times" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" data-fa-i2svg=""><path fill="currentColor" d="M323.1 441l53.9-53.9c9.4-9.4 9.4-24.5 0-33.9L279.8 256l97.2-97.2c9.4-9.4 9.4-24.5 0-33.9L323.1 71c-9.4-9.4-24.5-9.4-33.9 0L192 168.2 94.8 71c-9.4-9.4-24.5-9.4-33.9 0L7 124.9c-9.4 9.4-9.4 24.5 0 33.9l97.2 97.2L7 353.2c-9.4 9.4-9.4 24.5 0 33.9L60.9 441c9.4 9.4 24.5 9.4 33.9 0l97.2-97.2 97.2 97.2c9.3 9.3 24.5 9.3 33.9 0z"></path></svg>'
        html += '<span class="mypa-pickup-location-details-location"><h3>' + this.currentLocation.location  + '</h3></span>'
        html += '<span class="mypa-pickup-location-details-street">' + this.currentLocation.street + '&nbsp;' + this.currentLocation.number + '</span>';
        html += '<span class="mypa-pickup-location-details-city">' + this.currentLocation.postal_code + '&nbsp;' + this.currentLocation.city + '</span>';
        if(this.currentLocation.phone_number){
            html += '<span class="mypa-pickup-location-details-phone">' + this.currentLocation.phone_number  + '</span>'
        }
        html += '<span class="mypa-pickup-location-details-time">Ophalen vanaf:&nbsp;' + startTime + '</span>'
        html += '<h3>Openingstijden</h3>';

        mypajQuery.each(
            this.currentLocation.opening_hours, function(weekday, value){
                html += '<span class="mypa-pickup-location-details-day">' + MyParcel.data.translateENtoNL[weekday] + "</span> ";

                if(value[0] === undefined ){
                    html +=  '<span class="mypa-time">Gesloten</span>';
                }

                mypajQuery.each(value, function(key2, times){
                    html +=  '<span class="mypa-time">' + times + "</span>";
                });
                html += "<br>";
            });

        mypajQuery('#mypa-location-details').html(html).show();
    },

    /*
     * retryPostalcodeHouseNumber
     *
     * After detecting an unrecognised postcal code / house number combination the user can try again.
     * This function copies the newly entered data back into the webshop forms.
     *
     */

    retryPostalcodeHouseNumber: function()
    {
        this.data.address.postalCode = mypajQuery('#mypa-error-postcode').val();
        this.data.address.number = mypajQuery('#mypa-error-number').val();
        MyParcel.callDeliveryOptions();
        mypajQuery('#mypa-select-delivery').click();
    },

    /*
     * showFallBackDelivery
     *
     * If the API call fails and we have no data about delivery or pick up options
     * show the customer an "As soon as possible" option.
     */

    showFallBackDelivery: function()
    {
        MyParcel.hideSpinner();
        MyParcel.hideDelivery();
        mypajQuery('#mypa-select-date, #method-myparcel-normal').hide();
        mypajQuery('.mypa-is-pickup-element').hide();
        mypajQuery('#mypa-select-delivery-titel').html('Zo snel mogelijk bezorgen');
    },


    /*
     * showRetru
     *
     * If a customer enters an unrecognised postal code housenumber combination show a
     * pop-up so they can try again.
     */

    showRetry: function()
    {
        MyParcel.showMessage(
            '<h3>Huisnummer/postcode combinatie onbekend</h3>' +
            '<div class="mypa-full-width mypa-error">'+
            '<label for="mypa-error-postcode">Postcode</label>' +
            '<input type="text" name="mypa-error-postcode" id="mypa-error-postcode" value="'+ MyParcel.data.address.postalCode +'">' +
            '</div><div class="mypa-full-width mypa-error">' +
            '<label for="mypa-error-number">Huisnummer</label>' +
            '<input type="text" name="mypa-error-number" id="mypa-error-number" value="'+ MyParcel.data.address.number +'">' +
            '<br><button id="mypa-error-try-again">Opnieuw</button>' +
            '</div>'
        );

        /* remove trigger that closes message */
        mypajQuery('#mypa-message').off('click');

        /* bind trigger to new button */
        mypajQuery('#mypa-error-try-again').on('click', function(){
            MyParcel.retryPostalcodeHouseNumber();
        });
    },


    /*
     * callDeliveryOptions
     *
     * Calls the MyParcel API to retrieve the pickup and delivery options for given house number and
     * Postal Code.
     *
     */

    callDeliveryOptions: function()
    {
        MyParcel.showSpinner();
        MyParcel.clearPickUpLocations();

        var cc 				= this.data.address.cc;
        var postalCode 		= this.data.address.postalCode;
        var number 			= this.data.address.number;
        var city 			= this.data.address.city;

        if (postalCode == '' || number == ''){
            MyParcel.showMessage(
                '<h3>Adres gegevens zijn niet ingevuld</h3>'
            );
        }
        if (cc === "BE") {
            var numberExtra 	= this.data.address.numberExtra;
            var street 			= this.data.address.street;
        }

        if(numberExtra){
            number = number + numberExtra;
        }

        /* Don't call API unless both Postcode and House Number are set */
        if(!number || !postalCode) {
            MyParcel.showFallBackDelivery();
            return;
        }

        /* Make the api request */
        mypajQuery.get(this.data.config.apiBaseUrl + "delivery_options",
            {
                cc           			:this.data.address.cc,
                postal_code  			:postalCode,
                number       			:number,
                city					:city,
                carrier      			:this.data.config.carrier,
                dropoff_days			:this.data.config.dropOffDays,
                monday_delivery			:this.data.config.allowMondayDelivery,
                deliverydays_window		:this.data.config.deliverydaysWindow,
                cutoff_time 			:this.data.config.cutoffTime
            })
            .done(function(response){

                MyParcel.data.deliveryOptions = response;
                if(response.errors){
                    mypajQuery.each(response.errors, function(key, value){
                        /* Postalcode housenumber combination not found or not recognised. */
                        if(value.code == '3212' || value.code == '3505'){
                            MyParcel.showRetry();
                        }

                        /* Any other error */
                        else {
                            MyParcel.showFallBackDelivery();
                        }
                    });
                }

                /* No errors */
                else {
                    MyParcel.hideMessage();
                    MyParcel.showPickUpLocations();
                    MyParcel.showDeliveryDates();
                    if(MyParcel.data.deliveryOptions.data.delivery.length <= 0 ){
                        MyParcel.hideDeliveryDates();
                    }
                    MyParcel.storeDeliveryOptions = response;
                }
                MyParcel.hideSpinner();
            })
            .fail(function(){
                MyParcel.showFallBackDelivery();
            })
            .always(function(){
                mypajQuery('#mypa-select-delivery').click();
            });
    }
}
