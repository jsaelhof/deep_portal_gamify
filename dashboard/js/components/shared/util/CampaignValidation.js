var i18n = require('../../../store/i18nStore');
var CampaignStore = require('../../../store/CampaignStore');
var ConfigStore = require('../../../store/ConfigStore');
var TimezoneStore = require('../../../store/TimezoneStore');
var Constants = require ('../Constants');

let GAME_AND_PRIZE_EDITOR = "GameAndPrizeEditor";
let INSTANT_WIN_PRIZE_EDITOR = "InstantWinPrizeEditor";
let DRAW_PRIZE_EDITOR = "DrawPrizeEditor";
let EVERYONE_WINS_PRIZE_EDITOR = "EveryoneWinsPrizeEditor";
let SCHEDULE_EDITOR = "ScheduleEditor";
let TRIGGER_EDITOR = "TriggerEditor";

function validateStandardPrizeInfo ( campaignDetails, validationErrors, events, target ) {
    if (events) {
        events.forEach( (guid, index) => {
            let prizeData = campaignDetails.prizes[guid];

            if (!prizeData.title || prizeData.title.length === 0) {
                validationErrors.push( { 
                    id:"invalidPrizeTitle",
                    target:target,
                    message:i18n.stringFor("sh_error_gameeditor_invalid_prize_title")
                                .replace("{0}",index + 1)
                                .replace("{1}",i18n.stringFor("sh_label_prize_"+prizeData.type)),
                    prizeId:prizeData.id
                } );
            }

            if ((prizeData.coupon_code === undefined || prizeData.coupon_code.length === 0) && prizeData.product_type === "incentive")  {
                validationErrors.push( { 
                    id:"missingCouponCode", 
                    target:target,
                    message: i18n.stringFor("sh_error_gameeditor_missing_coupon_code")
                                .replace("{0}",index + 1)
                                .replace("{1}",i18n.stringFor("sh_label_prize_"+prizeData.type)),
                    prizeId:prizeData.id
                } );
            }
        });
    }
}

function validateWinPercent ( campaignDetails, validationErrors, target ) {
    let totalWinPercent = 0;
    
    if (campaignDetails.instantEvents) {
        campaignDetails.instantEvents.forEach(guid => {
            let prizeData = campaignDetails.prizes[guid];

            // Add this prizes win percent to the total.
            totalWinPercent += parseFloat(prizeData.winPercent);
        });
    }
    
    // Add the loss case percent if the campaign has it.
    if (campaignDetails.loss) {
        totalWinPercent += parseFloat(campaignDetails.loss.lossPercent);
    }
    
    // Fix Precision
    totalWinPercent = parseFloat(totalWinPercent.toFixed(2));

    if (totalWinPercent !== 100) validationErrors.push( { 
        id:"invalidWinPercent", 
        target:target,
        message:i18n.stringFor("sh_error_gameeditor_invalid_win_precent") 
    } );
}

function validateURLFilters ( filters, validationErrors ) {
    validationErrors = validationErrors || [];

    filters.forEach( (filter, index) => {
        if (filter.url === "") {
            validationErrors.push( { 
                id:"invalidUrlFilter", 
                target:TRIGGER_EDITOR,
                message:i18n.stringFor("sh_error_triggereditor_invalid_url_filter").replace("{0}",index + 1),
                index: index
            } );
        }
    } );

    return validationErrors;
}

function validateDrawsInfo ( campaignDetails, validationErrors ) {
    if (campaignDetails.multiDrawEvents) {
        campaignDetails.multiDrawEvents.forEach( draw => {
            let startMoment = TimezoneStore.getMomentInTimezone(draw.options.start,campaignDetails.timezone);
            let endMoment = TimezoneStore.getMomentInTimezone(draw.options.end,campaignDetails.timezone);
            let nowMoment = i18n.moment.tz();

            if (!draw.label || draw.label.length === "0") {
                validationErrors.push({
                    id: "invalidDrawTitle",
                    target: DRAW_PRIZE_EDITOR,
                    drawId: draw.id,
                    message: i18n.stringFor("sh_error_gameeditor_invalid_draw_title").replace("{0}",parseInt(draw.displayIndex) + 1)
                })
            }
        } );
    }
}

function validateDrawsSchedule ( campaignDetails, validationErrors ) {
    if (campaignDetails.multiDrawEvents) {
        campaignDetails.multiDrawEvents.forEach( draw => {
            let startMoment = TimezoneStore.getMomentInTimezone(draw.options.start,campaignDetails.timezone);
            let endMoment = TimezoneStore.getMomentInTimezone(draw.options.end,campaignDetails.timezone);
            let nowMoment = i18n.moment.tz();

            if (!draw.options.end) {
                validationErrors.push({
                    id: "drawDateMissing",
                    target: DRAW_PRIZE_EDITOR,
                    drawId: draw.id,
                    message: i18n.stringFor("sh_error_gameeditor_draw_date_missing").replace("{0}",parseInt(draw.displayIndex) + 1)
                })
            }

            if (!draw.options.start) {
                validationErrors.push({
                    id: "startDateMissing",
                    target: DRAW_PRIZE_EDITOR,
                    drawId: draw.id,
                    message: i18n.stringFor("sh_error_gameeditor_draw_start_date_missing").replace("{0}",parseInt(draw.displayIndex) + 1)
                })
            }


            if (draw.options.end && endMoment.isBefore(nowMoment)) {
                validationErrors.push({
                    id: "drawOccursInThePast",
                    target: DRAW_PRIZE_EDITOR,
                    drawId: draw.id,
                    message: i18n.stringFor("sh_error_gameeditor_draw_date_past").replace("{0}",parseInt(draw.displayIndex) + 1)
                })
            }

            if (draw.options.start && draw.options.end && startMoment.isSameOrAfter(endMoment)) {
                validationErrors.push({
                    id: "startOccursAfterDraw",
                    target: DRAW_PRIZE_EDITOR,
                    drawId: draw.id,
                    message: i18n.stringFor("sh_error_gameeditor_draw_start_date_invalid")
                                .replace("{0}",parseInt(draw.displayIndex) + 1)
                                .replace("{1}",startMoment.format(CampaignStore.fullDateDisplayFormat))
                                .replace("{2}",endMoment.format(CampaignStore.fullDateDisplayFormat))
                })
            }
        } );
    }
}

function validateCampaignSchedule ( campaignDetails, validationErrors ) {
    // Parse the dates we need; Start, End and Now; all in the correct timezone.
    let startMoment = TimezoneStore.getMomentInTimezone(campaignDetails.startDate,campaignDetails.timezone);
    let endMoment = TimezoneStore.getMomentInTimezone(campaignDetails.endDate,campaignDetails.timezone);
    let nowMoment = i18n.moment.tz();

    if (!campaignDetails.startDate) {
        validationErrors.push({
            id: "startDateMissing",
            target: SCHEDULE_EDITOR,
            message: i18n.stringFor("sh_error_start_date_missing")
        })
    }

    if (!campaignDetails.endDate) {
        validationErrors.push({
            id: "endDateMissing",
            target: SCHEDULE_EDITOR,
            message: i18n.stringFor("sh_error_end_date_missing")
        })
    }

    if (campaignDetails.startDate && startMoment.isBefore(nowMoment)) {
        validationErrors.push({
            id: "startDateOccursInThePast",
            target: SCHEDULE_EDITOR,
            message: i18n.stringFor("sh_error_start_date_past")
        })
    }

    if (campaignDetails.endDate && endMoment.isBefore(nowMoment)) {
        validationErrors.push({
            id: "endDateOccursInThePast",
            target: SCHEDULE_EDITOR,
            message: i18n.stringFor("sh_error_end_date_past")
        })
    }

    if (campaignDetails.startDate && campaignDetails.endDate) {
        if (startMoment.isAfter(endMoment) || startMoment.isSame(endMoment)) {
            validationErrors.push({
                id: "startOccursAfterEnd",
                target: SCHEDULE_EDITOR,
                message: i18n.stringFor("sh_error_start_date_invalid")
                            .replace("{0}",startMoment.format(CampaignStore.fullDateDisplayFormat))
                            .replace("{1}",endMoment.format(CampaignStore.fullDateDisplayFormat))
            })
        }
    }
}

// PRODUCT VALIDATION METHODS - These define what should be validated based on the product type

function validateSlideout ( campaignDetails, campaignStatus, ignoreDateValidations ) {
    let validationErrors = [];

    // Validate the instant prizes
    validateStandardPrizeInfo( campaignDetails, validationErrors, campaignDetails.instantEvents, GAME_AND_PRIZE_EDITOR );

    // Validate the win percent
    validateWinPercent( campaignDetails, validationErrors, GAME_AND_PRIZE_EDITOR );

    if (campaignDetails.integration 
        && campaignDetails.integration.uiConfig 
        && campaignDetails.integration.uiConfig.urlFiltering
        && campaignDetails.integration.uiConfig.urlFiltering.filters
    ) {
        validateURLFilters( campaignDetails.integration.uiConfig.urlFiltering.filters, validationErrors );
    }

    // Validate the draw container information
    validateDrawsInfo( campaignDetails, validationErrors );

    // Loop over all the draws.
    // For each draw, it's "prizes" array is a list of prize guids exactly like the instantEvents, giveawayEvents etc for the other prize types.
    // Validate that array to make sure the prizes are configured proeperly jsut like we do with instantEvents etc.
    if (campaignDetails.multiDrawEvents) {
        campaignDetails.multiDrawEvents.forEach( draw => {
            validateStandardPrizeInfo( campaignDetails, validationErrors, draw.prizes, DRAW_PRIZE_EDITOR );
        } );
    }

    // Only validate the campaign schedule if it hasn't been activated or is in the process of being activated.
    // Once it's schedule, running, ended etc then it's ok for the dates to be in the past.
    // Dates should not be missing in these states since they must be set before it can be moved out of UNSCHEDULED.
    if ( CampaignStore.isUnscheduled(campaignStatus) && !ignoreDateValidations ) {
        validateDrawsSchedule( campaignDetails, validationErrors );
    }

    return validationErrors;
}

function validateSocial ( campaignDetails, campaignStatus, ignoreDateValidations ) {
    let validationErrors = [];

    // Validate the instant prizes
    validateStandardPrizeInfo( campaignDetails, validationErrors, campaignDetails.instantEvents, INSTANT_WIN_PRIZE_EDITOR );

    // Validate the win percent
    validateWinPercent( campaignDetails, validationErrors, INSTANT_WIN_PRIZE_EDITOR );

    // Validate the everyone wins prizes
    validateStandardPrizeInfo( campaignDetails, validationErrors, campaignDetails.giveawayEvents, EVERYONE_WINS_PRIZE_EDITOR );

    // Validate the draw container information
    validateDrawsInfo( campaignDetails, validationErrors );

    // Loop over all the draws.
    // For each draw, it's "prizes" array is a list of prize guids exactly like the instantEvents, giveawayEvents etc for the other prize types.
    // Validate that array to make sure the prizes are configured proeperly jsut like we do with instantEvents etc.
    if (campaignDetails.multiDrawEvents) {
        campaignDetails.multiDrawEvents.forEach( draw => {
            validateStandardPrizeInfo( campaignDetails, validationErrors, draw.prizes, DRAW_PRIZE_EDITOR );
        } );
    }

    // Only validate the campaign schedule if it hasn't been activated or is in the process of being activated.
    // Once it's schedule, running, ended etc then it's ok for the dates to be in the past.
    // Dates should not be missing in these states since they must be set before it can be moved out of UNSCHEDULED.
    if ( CampaignStore.isUnscheduled(campaignStatus) && !ignoreDateValidations ) {
        validateDrawsSchedule( campaignDetails, validationErrors );
        validateCampaignSchedule( campaignDetails, validationErrors );
    }

    return validationErrors;
}

function validateEmailBanner ( campaignDetails, campaignStatus, ignoreDateValidations ) {
    let validationErrors = [];

    // Validate the everyone wins prizes
    validateStandardPrizeInfo( campaignDetails, validationErrors, campaignDetails.giveawayEvents, EVERYONE_WINS_PRIZE_EDITOR );

    if (campaignDetails.integration 
        && campaignDetails.integration.uiConfig 
        && campaignDetails.integration.uiConfig.urlFiltering
        && campaignDetails.integration.uiConfig.urlFiltering.filters
    ) {
        validateURLFilters( campaignDetails.integration.uiConfig.urlFiltering.filters, validationErrors );
    }

    return validationErrors;
}


module.exports = {

    GAME_AND_PRIZE_EDITOR: GAME_AND_PRIZE_EDITOR,
    INSTANT_WIN_PRIZE_EDITOR: INSTANT_WIN_PRIZE_EDITOR,
    DRAW_PRIZE_EDITOR: DRAW_PRIZE_EDITOR,
    EVERYONE_WINS_PRIZE_EDITOR: EVERYONE_WINS_PRIZE_EDITOR,
    SCHEDULE_EDITOR: SCHEDULE_EDITOR,
    TRIGGER_EDITOR: TRIGGER_EDITOR,

    validate: function ( product, campaignDetails, campaignStatus, ignoreDateValidations ) {
        switch (product) {
            case Constants.PRODUCT_SLIDEOUT:
                return validateSlideout( campaignDetails, campaignStatus, ignoreDateValidations );
                break;
            case Constants.PRODUCT_EMAIL_BANNER:
                return validateEmailBanner( campaignDetails, campaignStatus, ignoreDateValidations );
                break;
            case Constants.PRODUCT_SOCIAL:
                return validateSocial( campaignDetails, campaignStatus, ignoreDateValidations );
                break;
            default:
                throw "Invalid Product @ Campaign Validation"
                break;
        }
    },

    validateSlideout: function ( campaignDetails, campaignStatus, ignoreDateValidations ) {
        return validateSlideout( campaignDetails, campaignStatus, ignoreDateValidations );
    },

    validateEmailBanner: function ( campaignDetails, campaignStatus, ignoreDateValidations ) {
        return validateEmailBanner( campaignDetails, campaignStatus, ignoreDateValidations );
    },

    validateSocial: function ( campaignDetails, campaignStatus, ignoreDateValidations ) {
        return validateSocial( campaignDetails, campaignStatus, ignoreDateValidations );
    },

    validateURLFilters: validateURLFilters

}
