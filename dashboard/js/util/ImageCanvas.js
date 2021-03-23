function toDataURL ( url ) {
    return new Promise( ( resolve, reject ) => {
        let canvas = document.createElement( 'canvas' );
        let context = canvas.getContext( '2d' );
        let img = new Image();

        img.onload = () => {
            try {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                context.drawImage( img, 0, 0 );

                resolve( canvas.toDataURL() );
            } catch ( e ) {
                reject( e );
            }
        };

        img.src = url;
    } );
}

function getType ( data ) {
    return data.split( 'data:' )[ 1 ].split( ';' )[ 0 ];
}

module.exports = {
    toDataURL, getType
};

