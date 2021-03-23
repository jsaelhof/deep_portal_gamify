let _ = require ('underscore');

module.exports = {

    getNextPrizeDisplayIndex: function ( campaignDetails ) {
        // This method gets the next display index to use for a new prize. 
        // It should always return a number larger than largest display index currently in use.
        // -1 is a sentinel value meaning no prizes were found.
        // If that's the case it becomes 0 when returned which is our starting index.

        let largest = -1;

        _.each( campaignDetails.prizes, prize => {
            if (prize.displayIndex !== undefined) {
                let index = parseInt(prize.displayIndex);
                largest = Math.max(largest, index);
            }
        } );

        largest++;

        return largest;
    },

    getNextDrawDisplayIndex: function ( campaignDetails ) {
        // This method gets the next display index to use for a new draw. 
        // It should always return a number larger than largest display index currently in use.
        // -1 is a sentinel value meaning no prizes were found.
        // If that's the case it becomes 0 when returned which is our starting index.

        let largest = -1;

        _.each( campaignDetails.multiDrawEvents, draw => {
            if (draw.displayIndex !== undefined) {
                let index = parseInt(draw.displayIndex);
                largest = Math.max(largest, index);
            }
        } );

        largest++;

        return largest;
    },

    getMainLink: function ( campaignDetails ) {
        return _.findWhere(campaignDetails.tracking.links, { "channelCode": "main" } ).shortURL;
    }

}