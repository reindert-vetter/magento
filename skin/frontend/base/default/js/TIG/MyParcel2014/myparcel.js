// Generated by CoffeeScript 1.10.0
(function() {
    var $, CARRIER, DAYS_OF_THE_WEEK, DAYS_OF_THE_WEEK_TRANSLATED, DEFAULT_DELIVERY, EVENING_DELIVERY, MORNING_DELIVERY, MORNING_PICKUP, NATIONAL, NORMAL_PICKUP, PICKUP, PICKUP_EXPRESS, PICKUP_TIMES, POST_NL_TRANSLATION, base, base1, base2, base3, displayOtherTab, fetchDeliveryOptions, initialize, makeSlider, obj, orderDays, orderOpeningHours, preparePickup, renderDays, renderExpressPickup, renderPage, renderPickup, renderPickupLocation, slideLeft, slideRight, updateDelivery;

    $ = jQuery.noConflict();

    if (window.mypa == null) {
        window.mypa = {};
    }

    if ((base = window.mypa).fn == null) {
        base.fn = {};
    }

    if ((base1 = window.mypa).settings == null) {
        base1.settings = {};
    }

    if ((base2 = window.mypa.settings).price == null) {
        base2.price = {};
    }

    if ((base3 = window.mypa.settings).base_url == null) {
        base3.base_url = "//localhost:8080/api/delivery_options";
    }

    NATIONAL = 'NL';

    CARRIER = 1;

    MORNING_DELIVERY = 'morning';

    DEFAULT_DELIVERY = 'default';

    EVENING_DELIVERY = 'night';

    PICKUP = 'pickup';

    PICKUP_EXPRESS = 'pickup_express';

    POST_NL_TRANSLATION = {
        morning: 'morning',
        standard: 'default',
        avond: 'night'
    };

    DAYS_OF_THE_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    DAYS_OF_THE_WEEK_TRANSLATED = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

    MORNING_PICKUP = '08:30:00';

    NORMAL_PICKUP = '16:00:00';

    PICKUP_TIMES = (
        obj = {},
            obj["" + MORNING_PICKUP] = 'morning',
            obj["" + NORMAL_PICKUP] = 'normal',
            obj
    );

    displayOtherTab = function() {
        $('.mypa-tab-container').toggleClass('mypa-slider-pos-1').toggleClass('mypa-slider-pos-0');
        return fetchDeliveryOptions();
    };

    window.mypa.fn.updatePage = fetchDeliveryOptions = function(postal_code, number, street) {
        var item, key, options, ref, settings, urlBase;
        ref = window.mypa.settings.price;
        for (key in ref) {
            item = ref[key];
            if (typeof item !== 'string' && typeof item == 'number') {
                throw 'Price needs to be of type string';
            }
        }
        settings = window.mypa.settings;
        urlBase = settings.base_url;
        if (number == null) {
            number = settings.number;
        }
        if (postal_code == null) {
            postal_code = settings.postal_code;
        }
        if (street == null) {
            street = settings.street;
        }
        if (!((street != null) || (postal_code != null) || (number != null))) {
            return;
        }

        $('.mypa-location').html(street + " " + number);
        options = {
            url: urlBase,
            data: {
                cc: NATIONAL,
                carrier: CARRIER,
                number: number,
                postal_code: postal_code,
                delivery_time: settings.delivery_time != null ? settings.delivery_time : void 0,
                delivery_date: settings.delivery_date != null ? settings.delivery_date : void 0,
                cutoff_time: settings.cutoff_time != null ? settings.cutoff_time : void 0,
                dropoff_days: settings.dropoff_days != null ? settings.dropoff_days : void 0,
                dropoff_delay: settings.dropoff_delay != null ? settings.dropoff_delay : void 0,
                deliverydays_window: settings.deliverydays_window != null ? settings.deliverydays_window : void 0,
                exlude_delivery_type: settings.exclude_delivery_type != null ? settings.exclude_delivery_type : void 0
            },
            success: renderPage
        };
        return $.ajax(options);
    };


    /*
     * Starts the render of the delivery options with the preset config
     */

    renderPage = function(response) {
        renderDays(response.data.delivery);
        return preparePickup(response.data.pickup);
    };

    preparePickup = function(pickupOptions) {
        var filter, i, j, len, len1, name, pickupExpressPrice, pickupLocation, pickupPrice, ref, time;
        pickupPrice = window.mypa.settings.price[PICKUP];
        if (pickupPrice == null) {
            pickupPrice = 'GRATIS';
        }
        pickupExpressPrice = window.mypa.settings.price[PICKUP_EXPRESS];
        if (pickupExpressPrice == null) {
            pickupExpressPrice = 'GRATIS';
        }
        $('.mypa-pickup-price').html(pickupPrice);
        $('.mypa-pickup-express-price').html(pickupExpressPrice);
        window.mypa.pickupFiltered = filter = {};
        for (i = 0, len = pickupOptions.length; i < len; i++) {
            pickupLocation = pickupOptions[i];
            ref = pickupLocation.time;
            for (j = 0, len1 = ref.length; j < len1; j++) {
                time = ref[j];
                if (filter[name = PICKUP_TIMES[time.start]] == null) {
                    filter[name] = [];
                }
                filter[PICKUP_TIMES[time.start]].push(pickupLocation);
            }
        }
        if (filter[PICKUP_TIMES[MORNING_PICKUP]] == null) {
            $('#mypa-pickup-express').parent().css({
                display: 'none'
            });
        }
        $('label[for=mypa-pickup]').off().bind('click', renderPickup);
        return $('label[for=mypa-pickup-express]').off().bind('click', renderExpressPickup);
    };

    renderPickup = function() {
        renderPickupLocation(window.mypa.pickupFiltered[PICKUP_TIMES[NORMAL_PICKUP]]);
        $('.mypa-location-time').html('- Vanaf 16.00 uur');
        $('#mypa-pickup').prop('checked', true);
        return false;
    };

    renderExpressPickup = function() {
        renderPickupLocation(window.mypa.pickupFiltered[PICKUP_TIMES[MORNING_PICKUP]]);
        $('.mypa-location-time').html('- Vanaf 08.30 uur');
        $('#mypa-pickup-express').prop('checked', true);
        return false;
    };

    renderPickupLocation = function(data) {
        var day_index, html, i, index, j, k, len, location, openingHoursHtml, orderedHours, ref, ref1, results, time;
        displayOtherTab();
        $('#mypa-location-container').html('');
        results = [];
        for (index = i = 0, ref = data.length - 1; 0 <= ref ? i <= ref : i >= ref; index = 0 <= ref ? ++i : --i) {
            location = data[index];
            orderedHours = orderOpeningHours(location.opening_hours);
            openingHoursHtml = '';
            for (day_index = j = 0; j <= 6; day_index = ++j) {
                openingHoursHtml += "<div>\n  <div class='mypa-day-of-the-week'>\n    " + DAYS_OF_THE_WEEK_TRANSLATED[day_index] + ":\n  </div>\n  <div class='mypa-opening-hours-list'>";
                ref1 = orderedHours[day_index];
                for (k = 0, len = ref1.length; k < len; k++) {
                    time = ref1[k];
                    openingHoursHtml += "<div>" + time + "</div>";
                }
                if (orderedHours[day_index].length < 1) {
                    openingHoursHtml += "<div><i>Gesloten</i></div>";
                }
                openingHoursHtml += '</div></div>';
            }
            html = "<div for='mypa-pickup-location-" + index + "' class=\"mypa-row-lg\">\n  <input id=\"mypa-pickup-location-" + index + "\" type=\"radio\" name=\"mypa-pickup-option\" value='" + (JSON.stringify(location)) + "'>\n  <label for='mypa-pickup-location-" + index + "' class='mypa-row-title'>\n    <div class=\"mypa-checkmark mypa-main\">\n      <div class=\"mypa-circle\"></div>\n      <div class=\"mypa-checkmark-stem\"></div>\n      <div class=\"mypa-checkmark-kick\"></div>\n    </div>\n    <span class=\"mypa-highlight\">" + location.location + ", <b>" + location.street + " " + location.number + "</b>,\n    <i>" + (String(Math.round(location.distance / 100) / 10).replace('.', ',')) + " Km</i></span>\n  </label>\n  <i class='mypa-info'>\n  </i>\n  <div class='mypa-opening-hours'>\n    " + openingHoursHtml + "\n  </div>\n</div>";
            results.push($('#mypa-location-container').append(html));
        }
        return results;
    };

    orderOpeningHours = function(opening_hours) {
        var array, day, i, len;
        array = [];
        for (i = 0, len = DAYS_OF_THE_WEEK.length; i < len; i++) {
            day = DAYS_OF_THE_WEEK[i];
            array.push(opening_hours[day]);
        }
        return array;
    };


    /*
     * Renders the available days for delivery
     */

    renderDays = function(deliveryDays) {
        var $el, $tabs, date, delivery, deliveryTimes, html, i, index, len;
        deliveryDays.sort(orderDays);
        deliveryTimes = window.mypa.sortedDeliverytimes = {};
        $el = $('#mypa-tabs').html('');
        $('#mypa-delivery-options-container').width();
        index = 0;
        for (i = 0, len = deliveryDays.length; i < len; i++) {
            delivery = deliveryDays[i];
            deliveryTimes[delivery.date] = delivery.time;
            date = moment(delivery.date);
            html = "<input type=\"radio\" id=\"mypa-date-" + index + "\" class=\"mypa-date\" name=\"date\" checked value=\"" + delivery.date + "\">\n<label for='mypa-date-" + index + "' class='mypa-tab active'>\n  <span class='day-of-the-week'>" + (date.format('dddd')) + "</span>\n  <br>\n  <span class='date'>" + (date.format('DD MMMM')) + "</span>\n</label>";
            $el.append(html);
            index++;
        }
        $tabs = $('.mypa-tab');
        if ($tabs.length > 0) {
            $tabs.bind('click', updateDelivery);
            $tabs[0].click();
        }
        $el.width(deliveryDays.length * 105);
        return makeSlider();
    };

    updateDelivery = function(e) {
        var date, deliveryTimes, html, hvoPrice, i, index, json, len, onlyRecipientPrice, price, time, onlyRecipientTitle, hvoTitle;
        date = $("#" + ($(e.currentTarget).prop('for')))[0].value;
        $('#mypa-delivery-options').html('');
        html = '';
        deliveryTimes = window.mypa.sortedDeliverytimes[date];
        index = 0;
        for (i = 0, len = deliveryTimes.length; i < len; i++) {
            time = deliveryTimes[i];
            price = window.mypa.settings.price[POST_NL_TRANSLATION[time.price_comment]];
            if (price == null) {
                price = 'GRATIS';
            }
            json = {
                date: date,
                time: [time]
            };
            html += "<label for=\"mypa-time-" + index + "\" class='mypa-row-subitem'>\n  <input id='mypa-time-" + index + "' type=\"radio\" name=\"mypa-delivery-time\" value='" + (JSON.stringify(json)) + "'>\n  <label for=\"mypa-time-" + index + "\" class=\"mypa-checkmark\">\n    <div class=\"mypa-circle mypa-circle-checked\"></div>\n    <div class=\"mypa-checkmark-stem\"></div>\n    <div class=\"mypa-checkmark-kick\"></div>\n  </label>\n  <span class=\"mypa-highlight\">" + (moment(time.start, 'HH:mm:SS').format('H.mm')) + " - " + (moment(time.end, 'HH:mm:SS').format('H.mm')) + " uur</span>\n  <span class='mypa-price'>" + price + "</span>\n</label>";
            index++;
        }
        hvoPrice = window.mypa.settings.price.signed;
        if (hvoPrice == null) {
            hvoPrice = 'GRATIS';
        }
        onlyRecipientPrice = window.mypa.settings.price.only_recipient;
        if (onlyRecipientPrice == null) {
            onlyRecipientPrice = 'GRATIS';
        }
        hvoTitle = window.mypa.settings.hvo_title;
        onlyRecipientTitle = window.mypa.settings.only_recipient_title;
        console.log(hvoTitle);
        if (onlyRecipientPrice !== 'disabled') {
            html += "<label for=\"mypa-only-recipient\" class='mypa-row-subitem'>\n  <input type=\"checkbox\" name=\"mypa-only-recipient\" class=\"mypa-onoffswitch-checkbox\" id=\"mypa-only-recipient\">\n  <div class=\"mypa-switch-container\">\n    <div class=\"mypa-onoffswitch\">\n      <label class=\"mypa-onoffswitch-label\" for=\"mypa-only-recipient\">\n        <span class=\"mypa-onoffswitch-inner\"></span>\n       <span class=\"mypa-onoffswitch-switch\"></span>\n      </label>\n    </div>\n  </div>\n  <span>" + onlyRecipientTitle + "<span class='mypa-price'>" + onlyRecipientPrice + "</span></span>\n</label>";
        }
        if (hvoPrice !== 'disabled') {
            html += "<label for=\"mypa-signed\" class='mypa-row-subitem'>\n  <input type=\"checkbox\" name=\"mypa-signed\" class=\"mypa-onoffswitch-checkbox\" id=\"mypa-signed\">\n  <div class=\"mypa-switch-container\">\n    <div class=\"mypa-onoffswitch\">\n      <label class=\"mypa-onoffswitch-label\" for=\"mypa-signed\">\n        <span class=\"mypa-onoffswitch-inner\"></span>\n      <span class=\"mypa-onoffswitch-switch\"></span>\n      </label>\n    </div>\n  </div>\n  <span>" + hvoTitle + "<span class='mypa-price'>" + hvoPrice + "</span></span>\n</label>";
        }
        $('#mypa-delivery-options').html(html);
        return $('#mypa-delivery-options .mypa-row-subitem input').on('change', function(e) {
            var deliveryType;
            deliveryType = JSON.parse($(e.currentTarget).val())['time'][0]['price_comment'];
            if (deliveryType === 'morning' || deliveryType === 'avond') {
                $('input#mypa-only-recipient').prop('checked', true).prop('disabled', true);
                return $('label[for=mypa-only-recipient] span.mypa-price').html('incl.');
            } else {
                onlyRecipientPrice = window.mypa.settings.price.only_recipient;
                if (onlyRecipientPrice == null) {
                    onlyRecipientPrice = 'GRATIS';
                }
                $('input#mypa-only-recipient').prop('disabled', false);
                return $('label[for=mypa-only-recipient] span.mypa-price').html(onlyRecipientPrice);
            }
        });
    };


    /*
     * Initializes the slider
     */

    makeSlider = function() {
        var slider;
        slider = window.mypa.slider = {};
        slider.barLength = $('#mypa-tabs-container').outerWidth();
        slider.bars = $('#mypa-tabs').outerWidth() / slider.barLength;
        slider.currentBar = 0;
        $('#mypa-date-slider-right').removeClass('mypa-slider-disabled');
        $('#mypa-date-slider-left').unbind().bind('click', slideLeft);
        return $('#mypa-date-slider-right').unbind().bind('click', slideRight);
    };


    /*
     * Event handler for sliding the date slider to the left
     */

    slideLeft = function(e) {
        var $el, left, slider;
        slider = window.mypa.slider;
        if (slider.currentBar === 1) {
            $(e.currentTarget).addClass('mypa-slider-disabled');
        } else if (slider.currentBar < 1) {
            return false;
        } else {
            $(e.currentTarget).removeClass('mypa-slider-disabled');
        }
        $('#mypa-date-slider-right').removeClass('mypa-slider-disabled');
        slider.currentBar--;
        $el = $('#mypa-tabs');
        left = slider.currentBar * slider.barLength * -1;
        left = parseInt(left / 104.0) * 104;
        return $el.css({
            left: left
        });
    };


    /*
     * Event handler for sliding the date slider to the right
     */

    slideRight = function(e) {
        var $el, left, slider;
        slider = window.mypa.slider;
        if (parseInt(slider.currentBar) === parseInt(slider.bars - 1)) {
            $(e.currentTarget).addClass('mypa-slider-disabled');
        } else if (slider.currentBar >= slider.bars - 1) {
            return false;
        } else {
            $(e.currentTarget).removeClass('mypa-slider-disabled');
        }
        $('#mypa-date-slider-left').removeClass('mypa-slider-disabled');
        slider.currentBar++;
        $el = $('#mypa-tabs');
        left = slider.currentBar * slider.barLength * -1;
        left = parseInt(left / 104.0) * 104;
        return $el.css({
            left: left
        });
    };


    /*
     * Order function for the delivery array
     */

    orderDays = function(dayA, dayB) {
        var dateA, dateB, max;
        dateA = moment(dayA.date);
        dateB = moment(dayB.date);
        max = moment.max(dateA, dateB);
        if (max === dateA) {
            return 1;
        }
        return -1;
    };

    initialize = function() {
        moment.locale(NATIONAL);
        fetchDeliveryOptions();
        $('#mypa-back-arrow').bind('click', function() {
            $('#mypa-location-container').html('');
            return displayOtherTab();
        });
        return null;
    };

    $(document).ready(initialize);

}).call(this);

//# sourceMappingURL=myparcel.js.map
