let reactGC = {
    loadScript: function () {
        ( function ( d, s, id, cb ) {
            var element = d.getElementsByTagName(s)[0];
            var fjs = element;
            var js = element;
            js = d.createElement(s);
            js.id = id;
            js.src = '//www.googleadservices.com/pagead/conversion_async.js';
            fjs.parentNode.insertBefore(js, fjs);
            js.onload = cb;
        } )( document, 'script', 'google-adword', function () {
            console.log( 'GoogleConversion.loaded', window.google_trackConversion );
        } );
    },
    addConversion: function () {
        if ( window.google_trackConversion ) {
            window.google_trackConversion( {
                google_conversion_id: 838262545,
                google_conversion_language: "en",
                google_conversion_format: "3",
                google_conversion_color: "ffffff",
                google_conversion_label: "OJidCNPN8HQQkb7bjwM",
                google_remarketing_only: false
            } );
            console.log( 'addConversion' );
        } else {
            console.error( 'GoogleConversions.addConvers failed' );
        }
    }
};

module.exports = reactGC;