let $ = require('jquery');
let EventDispatcher = require('../dispatcher/EventDispatcher');
let Unibabel = require( 'unibabel' ).Unibabel;
import GUID from '../util/guid';

let ThemeStore = EventDispatcher.createDispatcher( module.exports, [
    "ThemeListRetrieved",
    "ThemeDescriptorRetrieved",
    "ThemeDescriptorError",
    "ThemePropertiesRetrieved",
    "ThemePropertiesError",
    "PreviewSourceReady",
    "PreviewSourceError",
    "ThemeInitialized",
    "ThemeCustomized",
    "ThemeCustomizeError",
    "ThemeDescriptorCustomized",
    "ThemePropertiesCustomized",
    "UpdateThemeDescriptor",
    "UpdateThemeDescriptorData",
    "UpdateThemeProperties",
    'ThemePublished',
    "ThemeCampaignDataUpdated",
    "EditorDescriptorRetrieved",
    "EditorDescriptorError"
] );

ThemeStore.getList = function( productTag ) {
    let onSuccessResponse = function ( responseData ) {
        ThemeStore.dispatchThemeListRetrieved( { response: responseData } );
    };
    portalConnection.send( { 
        method: 'content/theme/list', 
        params: { tag: productTag }, 
        onSuccess: onSuccessResponse 
    } );
};

ThemeStore.initializeTheme = function ( campaignHash, themeName, themeBase, templateVersion ) {
    var onSuccessResponse = function ( responseData ) {
        ThemeStore.dispatchThemeInitialized( { response: responseData } );
    };

    let params = { campaignHash: campaignHash, themeName: themeName, themeBase: themeBase };
    if (templateVersion !== undefined) params.templateVersion = templateVersion;

    portalConnection.send( {
        method: '/campaign/custom/theme/initialize', 
        params: params, 
        onSuccess: onSuccessResponse 
    } );
};

ThemeStore.publish = function ( campaignHash, templateVersion, clientVersion, onSuccess  ) {
    let params = { campaignHash: campaignHash };
    if (templateVersion !== undefined) params.templateVersion = templateVersion;
    if (clientVersion !== undefined) params.clientVersion = clientVersion;

    portalConnection.send( {
        method: '/campaign/custom/theme/publish', 
        params: params, 
        onSuccess: onSuccess || ThemeStore.dispatchThemePublished 
    } );
};

// let CampaignDataSetter = {
//     campaignHash: '',
//     name: '',
//     template: '',
//     data: {},
//     properties: {},
//     // onThemePropertiesRetrieved ( e ) {
//     //     console.log( 'ThemeStore.CampaignDataSetter.onThemePropertiesRetrieved', e );
//     //     this.properties = e.properties;
//     //
//     //     if ( this.data.title ) {
//     //         this.properties.common.title.bannerTitle.value = this.data.title;
//     //     }
//     //
//     //     if ( this.data.introduction ) {
//     //         this.properties.common.introduction.bannerDetails.value = this.data.introduction;
//     //     }
//     //
//     //     if ( this.data.websiteUrl ) {
//     //         this.properties.common.callToAction.buttonLink.value = this.data.websiteUrl;
//     //     }
//     //
//     //     // upload logo
//     //     if ( this.data.logo ) {
//     //         console.log( 'ThemeStore.CampaignDataSetter.foundLogo', this.data.logo );
//     //         ThemeStore.uploadAsset( this.campaignHash, this.data.logo );
//     //     } else {
//     //         console.log( 'ThemeStore.CampaignDataSetter.noLogo', this.data.logo );
//     //         ThemeStore.customize( this.campaignHash, this.name, this.layout, this.properties );
//     //     }
//     // },
//     // onThemePropertiesError ( e ) {
//     //     console.log( 'ThemeStore.CampaignDataSetter.onThemePropertiesError', e );
//     //     this.throwError( e );
//     // },
//     onThemeAssetUploaded ( e ) {
//         // console.log( 'ThemeStore.CampaignDataSetter.onThemeAssetUploaded', e );
//         if ( e.response && e.response.hasErrors() ) {
//             this.throwError( e );
//         } else {
//             let key = Object.keys( e.result )[ 0 ];

//             this.properties.common.logo.logo_image.value = '/' + e.result[ key ].assetPath;

//             ThemeStore.customize( this.campaignHash, this.name, this.layout, this.properties );
//         }
//     },
//     onThemeAssetUploadError ( e ) {
//         console.log( 'ThemeStore.CampaignDataSetter.onThemeAssetUploadError', e );
//         this.throwError( e );
//     },
//     onThemeCustomized ( e ) {
//         // console.log( 'ThemeStore.CampaignDataSetter.onThemeCustomized', e );
//         if ( e.response && e.response.hasErrors() ) {
//             //return error
//             this.throwError( e );
//         } else {
//             // console.log( 'ThemeStore.CampaignDataSetter.onThemeCustomized', e );
//             this.onDone( this.properties );
//         }
//     },
//     onThemeCustomizeError ( e ) {
//         console.log( 'ThemeStore.CampaignDataSetter.onThemeCustomizeError', e );
//         this.throwError( e );
//     },
//     setData ( campaignHash, name, layout, data, properties ) {
//         this.campaignHash = campaignHash;
//         this.name = name;
//         this.layout = layout;
//         this.data = data;
//         this.properties = properties;

//         // console.log( 'ThemeStore.CampaignDataSetter.setData params: ', this.campaignHash, this.name, this.layout, this.data, this.properties );

//         return new Promise( function ( resolve, reject ) {
//             this.onDone = ( res ) => {
//                 // console.log( 'ThemeStore.CampaignDataSetter.onDone', res );
//                 ThemeStore.removeEventListener( this );
//                 resolve( { success: true, data: res } );
//             };
//             this.throwError = ( err ) => {
//                 console.log( 'ThemeStore.CampaignDataSetter.Error.Thrown', err );
//                 ThemeStore.removeEventListener( this );
//                 reject( { success: false, error: err } );
//             };

//             ThemeStore.addEventListener( this );

//             if ( !properties ) {
//                 this.throwError( 'ThemeProperties file is not defined' );
//             }

//             if ( this.data.title ) {
//                 this.properties.common.title.bannerTitle.value = this.data.title;
//             }

//             if ( this.data.introduction ) {
//                 this.properties.common.introduction.bannerDetails.value = this.data.introduction;
//             }

//             if ( this.data.websiteUrl ) {
//                 this.properties.common.callToAction.buttonLink.value = this.data.websiteUrl;
//             }

//             // upload logo
//             if ( this.data.logo ) {
//                 // console.log( 'ThemeStore.CampaignDataSetter.foundLogo', this.data.logo );
//                 ThemeStore.uploadAsset( this.campaignHash, this.data.logo, this.onThemeAssetUploaded.bind(this), this.onThemeAssetUploadError.bind(this));
//             } else {
//                 // console.log( 'ThemeStore.CampaignDataSetter.noLogo', this.data.logo );
//                 ThemeStore.customize( this.campaignHash, this.name, this.layout, this.properties );
//             }

//             // ThemeStore.getThemeProperties( this.campaignHash );
//         }.bind( this ) );
//     }
// };

// ThemeStore.setCampaignData = function ( campaignHash, themeName, themeBase, data, properties ) {
//     CampaignDataSetter.setData( campaignHash, themeName, themeBase, data, properties ).then( function ( res ) {
//         if ( res.success ) {
//             ThemeStore.dispatchThemeCampaignDataUpdated( { response: { success: true, hasErrors: function () { return false } } } );
//         } else {
//             ThemeStore.dispatchThemeCampaignDataUpdated( res );
//         }
//     } ).catch( function ( err ) {
//         var state = {
//             hasErrors: function () { return true; },
//             hasUncaughtException: function () { return true; },
//             errors: {
//                 uncaught_exception: {
//                     message: err.error
//                 }
//             }
//         };
//         ThemeStore.dispatchThemeCampaignDataUpdated( { response: state } );
//     } );
// };

ThemeStore.uploadAsset = function ( campaignHash, fileName, fileData, onSuccess, onError ) {
    let assets = {};

    assets[ fileName ] = {
        assetFile: fileName,
        assetSrc: fileData
    };

    let onSuccessResponse = function ( response ) {
        ThemeStore.dispatchThemeAssetUploaded( { response: response } );
    };

    portalConnection.send( { 
        method: 'campaign/custom/upload', 
        params: { campaignHash: campaignHash, type: 'theme', assets: assets }, 
        onSuccess: onSuccess, 
        onError: onError 
    } );
};

ThemeStore.customize = function ( campaignHash, themeName, themeBase, themeProperties ) {
    let onSuccessResponse = function ( responseData ) { ThemeStore.dispatchThemeCustomized( { response: responseData } ); };
    let onFailResponse = function ( res ) { ThemeStore.dispatchThemeCustomizeError( { response: res } ); };
    var params = {
        campaignHash: campaignHash,
        themeInfo: {
            themeName: themeName,
            themeBase: themeBase
        },
        type: 'theme',
        assets: {
            // 'themeDescriptor': {
            //     assetFile: 'themeDescriptor.json',
            //     assetSrc: toBase64( themeDescriptor )
            // },
            'themeproperties': {
                assetFile: 'themeproperties.json',
                assetSrc: toBase64( themeProperties )
            }
        }
    };

    portalConnection.send( {
        method: '/campaign/custom/upload', 
        params: params, 
        onSuccess: onSuccessResponse, 
        onError: onFailResponse 
    } );
};

ThemeStore.saveThemeDescriptor = function ( campaignHash, themeName, themeBase, themeDescriptor, onSuccess ) {
    //console.log("saveThemeDescriptor:", themeDescriptor);
    var onSuccessResponse = function ( responseData ) { ThemeStore.dispatchThemeDescriptorCustomized( { response: responseData } ); };
    var params = {
        campaignHash: campaignHash,
        themeInfo: {
            themeName: themeName,
            themeBase: themeBase
        },
        type: 'theme',
        assets: {
            'themeDescriptor': {
                assetFile: 'themedescriptor.json',
                assetSrc: toBase64( themeDescriptor )
            }
        }
    };

    portalConnection.send( {
        method: '/campaign/custom/upload', 
        params: params, 
        onSuccess: onSuccess || onSuccessResponse 
    } );
};

ThemeStore.saveThemeProperties = function ( campaignHash, themeName, themeBase, themeProperties ) {
    var onSuccessResponse = function ( responseData ) { ThemeStore.dispatchThemePropertiesCustomized( { response: responseData } ); };
    var params = {
        campaignHash: campaignHash,
        themeInfo: {
            themeName: themeName,
            themeBase: themeBase
        },
        type: 'theme',
        assets: {
            'themeProperties': {
                assetFile: 'themeproperties.json',
                assetSrc: toBase64( themeProperties )
            }
        }
    };
    portalConnection.send( { 
        method: '/campaign/custom/upload', 
        params: params, 
        onSuccess: onSuccessResponse 
    } );
};

ThemeStore.getThemeDescriptor = function ( campaignHash ) {
    // pull from /customthemes/<campaignCode>/themedescriptor.json
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        url: "/customthemes/" + campaignHash + "/themedescriptor.json",
        cache: false,
        success: function (data) {
            this.dispatchThemeDescriptorRetrieved({theme: data});
        }.bind(this),
        error: function (xhr, status, error) {
            var state = {
                hasErrors: function () { return true; },
                hasUncaughtException: function () { return true; },
                errors: {
                    uncaught_exception: {
                        message: "Error getting theme descriptor file"
                    }
                }
            };

            this.dispatchThemeDescriptorError( { response: state, error: error } );
            portalConnection.dispatchRequestDone( { response: state } );
        }.bind(this)
    });
};

ThemeStore.getThemeVersionFile = function ( template, onSuccess ) {
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        url: "/themes/" + template + "-code/latest.json",
        cache: false,
        success: onSuccess,
        error: function (xhr, status, error) {
            var state = {
                hasErrors: function () { return true; },
                hasUncaughtException: function () { return true; },
                errors: {
                    uncaught_exception: {
                        message: "Error getting theme version file"
                    }
                }
            };

            this.dispatchThemeDescriptorError( { response: state, error: error } );
            portalConnection.dispatchRequestDone( { response: state } );
        }.bind(this)
    });
};

ThemeStore.getClientVersionFile = function ( onSuccess ) {
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        url: "/client/js/latest.json",
        cache: false,
        success: onSuccess,
        error: function (xhr, status, error) {
            var state = {
                hasErrors: function () { return true; },
                hasUncaughtException: function () { return true; },
                errors: {
                    uncaught_exception: {
                        message: "Error getting client version file"
                    }
                }
            };

            this.dispatchThemeDescriptorError( { response: state, error: error } );
            portalConnection.dispatchRequestDone( { response: state } );
        }.bind(this)
    });
};

ThemeStore.getEditorDescriptor = function ( campaignHash ) {

    // pull from /customthemes/<campaignCode>/editordescriptor.json
    $.ajax({
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        url: "/customthemes/" + campaignHash + "/editordescriptor.json",
        cache: false,
        success: function (data) {
            this.dispatchEditorDescriptorRetrieved({theme: data});
        }.bind(this),
        error: function (xhr, status, error) {
            var state = {
                hasErrors: function () { return true; },
                hasUncaughtException: function () { return true; },
                errors: {
                    uncaught_exception: {
                        message: "Error getting editor descriptor file"
                    }
                }
            };

            this.dispatchEditorDescriptorError( { response: state, error: error } );
            portalConnection.dispatchRequestDone( { response: state } );
        }.bind(this)
    });
};


ThemeStore.getThemeProperties = function ( campaignHash ) {
    $.ajax( {
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        url: "/customthemes/" + campaignHash + "/themeproperties.json",
        cache: false,
        success: function (data) {
            this.dispatchThemePropertiesRetrieved({properties: data});
        }.bind( this ),
        error: function (xhr, status, error) {
            var state = {
                hasErrors: function () { return true; },
                hasUncaughtException: function () { return true; },
                errors: {
                    uncaught_exception: {
                        message: "Error getting theme properties file"
                    }
                }
            };

            this.dispatchThemePropertiesError( { response: state, error: error } );
            portalConnection.dispatchRequestDone( { response: state } );
        }.bind( this )
    } );
};

ThemeStore.getPreviewSource = function ( campaignHash, sourceCode ) {
    // check to see if preview is available
    $.ajax({
        type: 'GET',
        contentType: 'text/html',
        dataType: 'html',
        url:  "/runcampaign/entry/" + campaignHash + "/" + sourceCode,
        success: function (data) {
            this.dispatchPreviewSourceReady({html: data});
        }.bind(this),
        error: function (xhr, status, error) {
            var state = {
                hasErrors: function () { return true; },
                hasUncaughtException: function () { return true; },
                errors: {
                    uncaught_exception: {
                        message: "Error getting preview source"
                    }
                }
            };

            this.dispatchPreviewSourceError( { response: state, error: error } );
            portalConnection.dispatchRequestDone( { response: state } );
        }.bind(this)
    });
};

function toBase64 ( data ) {
    let _data = {};
    try {
        _data = JSON.stringify( data );

        try {
            _data = Unibabel.strToUtf8Arr( _data );

            try {
                return 'data:text/json;base64,' + Unibabel.arrToBase64( _data );
            } catch ( e ) {
                throw( e );
            }
        } catch ( e ) {
            throw( e );
        }
    } catch ( e ) {
        throw( e );
    }
}