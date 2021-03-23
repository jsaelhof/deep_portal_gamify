import $ from 'jquery';
import YAML from 'yamljs';
import EventDispatcher from '../dispatcher/EventDispatcher';
import SaveState from '../components/common/SaveState';
import CampaignStore from './CampaignStore';
import i18n from './i18nStore';
import ImageCanvas from '../util/ImageCanvas';
import GUID from '../util/guid';

let Unibabel = require( 'unibabel' ).Unibabel;

let gameEvents = EventDispatcher.hashFromArray( [
    "DescriptorLoaded",
    "DescriptorLoadError",
    "FilteredGameList",
    "GameListRetrieved",
    "GameDetailsRetrieved",
    "GameDataLoaded",
    "GameDataLoadError",
    "GameThemeDescriptorLoaded",
    "GameThemeDescriptorError",
    "CustomSkinSaved",
    "CustomSkinSaveError",
    "LanguageFileLoaded",
    "LanguageFileLoadError",
    "GameChanged",
    "GameChangeError",
    "GameStateChanged",
    "GameSkinInitialized",
    "GameSkinInitializeError",
    "PreloaderRetrieved",
    "PreloaderError",
    "QuestionsLoaded",
    "QuestionsLoadError",
    "QuestionsJsonSaved",
    "QuestionsSavedToServer",
    "LibraryLoaded",
    "GameLogoUpdated",
    "GameInfoLoaded"
] );

let GameStore = EventDispatcher.createDispatcher( module.exports, gameEvents );

GameStore.cache = {
    gameInfo: {},
    gameDetails: {},
    gameLibrary: {},
    games: {}
};

GameStore.getDefaultGameConfig = function ( product ) {
    return GameStore.defaultGameConfig[product];
}

//TODO: Find a better location for this
GameStore.origin = function () {
    // if it is a localhost path, then use development as origin..otherwise use what the browser returns for origin.
    if ( window.location.origin.indexOf( 'localhost' ) !== -1 ) {
        return 'https://development.deepmarkit.net';
    }

    return window.location.origin;
};

GameStore.srcPath = ( campaignHash, name, skin, params ) => "/campaignplay/" + campaignHash + "/core/index.html?gameId=" + name + "&skinId=" + skin + "&debug=dr" + ( params || '' );

GameStore.resourceSrcPath = ( name, skin, params ) => "/play/core/index.html?gameId=" + name + "&skinId=" + skin + "&debug=dr" + ( params || '' );

GameStore.getImgBasePath = ( campaignHash, type ) => '/campaignplay/' + campaignHash + '/games/' + type + '/';

let GameSelector = {
    name: '',
    skin: '',
    campaignHash: '',
    campaignDetails: '',
    language: '',
    descriptor: {},
    gameData: {},
    questions: { order: 'ordered', questions: [] },
    yaml: {},
    onGameSkinInitialized () {
        // console.log( 'GameStore.selectGame.onGameSkinInit' );
        this.campaignDetails.selectedGame = {
            'game-type': this.name,
            'skin-name': this.campaignHash,
            'original-skin': this.skin
        };

        // Check if the campaign details has the "features" and "features".leaderboard object that this will write to. If not, add them
        if (!this.campaignDetails.features) this.campaignDetails.features = {};
        if (!this.campaignDetails.features.leaderboard) this.campaignDetails.features.leaderboard = {};

        // TODO: This info about leaderboards being supported used to be hardcoded in this file per game. Now it's removed and is avialable from the server when calling GameStore.getList or GameStore.getDetailsForGame.
        this.campaignDetails.features.leaderboard.enabled = false; //GameStore.supports(  this.name, 'leaderboard' );

        CampaignStore.sendCampaignUpdate( this.campaignHash, this.campaignDetails, this.campaignVersion );
    },
    onCampaignUpdated ( e ) {
        GameStore.loadDescriptor( this.name, this.skin, this.campaignHash );
    },
    onDescriptorLoaded ( e ) {
        this.descriptor = e.state;
        GameStore.loadGameData( this.name, this.campaignHash );
    },
    onGameDataLoaded ( e ) {
        this.gameData = e.gamedata;
        GameStore.loadLanguageFile( this.language, this.name, this.campaignHash );
    },
    onLanguageFileLoaded ( e ) {
        this.yaml = e.yaml;

        if ( this.name === 'trivia' ) {
            GameStore.saveQuestionsJson( this.campaignHash, this.name, this.skin, this.questions );
        } else {
            this.onDone();
        }
    },
    onQuestionsJsonSaved ( e ) {
        if ( e && e.hasErrors() ) {
            this.onError( e );
        } else {
            this.onDone();
        }
    },
    onGameSkinInitializeError ( e ) {
        console.log( 'GameStore.selectGame.onSkinInitError', e );
        this.onError( e );
    },
    onDescriptorLoadError ( e ) {
        console.log( 'GameStore.selectGame.onDescriptorLoadError', e );
        this.onError( e );
    },
    onGameDataLoadError ( e ) {
        console.log( 'GameStore.selectGame.onGameDataLoadError', e );
        this.onError( e );
    },
    onLanguageFileLoadError ( e ) {
        console.log( 'GameStore.selectGame.onLanguageFileLoadError', e );
        this.onError( e );
    },
    selectGame ( name, skin, campaignHash, language, campaignDetails, campaignVersion ) {
        this.name = name;
        this.skin = skin;
        this.campaignHash = campaignHash;
        this.language = language;
        this.campaignDetails = campaignDetails;
        this.campaignVersion = campaignVersion;

        GameStore.addEventListener( this );
        CampaignStore.addEventListener( this );

        this.promise = new Promise( function ( resolve, reject ) {

            this.onDone = function () {
                // console.log( 'GameStore.selectGame.onDone' );
                GameStore.removeEventListener( this );
                CampaignStore.removeEventListener( this );
                resolve( { success: true, descriptor: this.descriptor, gameData: this.gameData, yaml: this.yaml } );
            };

            this.onError = function ( e ) {
                GameStore.removeEventListener( this );
                CampaignStore.removeEventListener( this );
                reject( { success: false, error: e } );
            };

            GameStore.initializeGameSkin( name, skin, campaignHash );
        }.bind( this ) );

        return this.promise;
    }
};

GameStore.selectGame = function ( gameName, skin, LANGUAGE, campaignHash, campaignDetails, campaignVersion ) {
    GameSelector.selectGame( gameName, skin, campaignHash, LANGUAGE, campaignDetails, campaignVersion ).then( function ( res ) {
        GameStore.dispatchGameChanged( {
            descriptor: res.descriptor,
            gamedata: res.gameData,
            yaml: res.yaml,
            selectedGame: { 'game-type': gameName, 'skin-name': campaignHash, 'original-skin': skin }
        } );
    } ).catch( function ( err ) {
        GameStore.dispatchGameChangeError( err.error );
    } );
};

GameStore.getList = function ( productTag ) {
    // Check if we have already made this request and cached a successful response. If so, just dispatch that instead of asking the server again.
    if (GameStore.cache.games[productTag]) {
        // Dispatch the cached copy. 
        // Do this in a very short timeout because this is expected to be an asynchronous call. 
        // We don't want the event firing before the calling function has even finished executing as it may cause a different behaviour if the event happens async or sync.
        setTimeout( () => { this.dispatchGameListRetrieved( GameStore.cache.games[productTag] ) }, 1 )
    } else {
        portalConnection.send( {
            method: 'content/game/list', 
            params: {
                tag: productTag
            }, 
            onSuccess: ( e ) => {
                // TODO: I think this information could be looped over and stored as the cached response for getDetailsForGame(x) for each game since it's a the same response, just for all games at once.
                GameStore.cache.games[productTag] = e;
                this.dispatchGameListRetrieved( e );
            }
        } );
    }
};

GameStore.getDetailsForGame = function ( gameName, productTag ) {
    // Check if we have already made this request and cached a successful response. If so, just dispatch that instead of asking the server again.
    if (GameStore.cache.gameDetails[gameName] && GameStore.cache.gameDetails[gameName][productTag]) {
        // Dispatch the cached copy. 
        // Do this in a very short timeout because this is expected to be an asynchronous call. 
        // We don't want the event firing before the calling function has even finished executing as it may cause a different behaviour if the event happens async or sync.
        setTimeout( () => { this.dispatchGameDetailsRetrieved( GameStore.cache.gameDetails[gameName][productTag] ) }, 1 )
    } else {
        portalConnection.send( {
            method: 'content/game/details', 
            params: { gameKey: gameName, tag: productTag }, 
            onSuccess: (e) => {
                this.cache.gameDetails[gameName] = this.cache.gameDetails[gameName] || {};
                this.cache.gameDetails[gameName][productTag] = e;
                this.dispatchGameDetailsRetrieved( e );
            }
        });
    }
};


GameStore.upload = function ( campaignHash, gameName, gameSkin, assets, onUploadProgress, onSuccess ) {
    let paramObject = { 
        method: 'campaign/custom/upload', 
        params: {
            campaignHash: campaignHash,
            type: 'game',
            assets: assets
        }, 
        onSuccess: onSuccess,
        onUploadProgress: onUploadProgress
    } 

    portalConnection.send( paramObject );
};

GameStore.getGameInfo = function ( name ) {
    // Check if we have already made this request and cached a successful response. If so, just dispatch that instead of asking the server again.
    if (GameStore.cache.gameInfo[name]) {
        // Dispatch the cached copy. 
        // Do this in a very short timeout because this is expected to be an asynchronous call. 
        // We don't want the event firing before the calling function has even finished executing as it may cause a different behaviour if the event happens async or sync.
        setTimeout( () => {
            this.dispatchGameInfoLoaded( { data: GameStore.cache.gameInfo[name] } );
        }, 1 );
    } else {
        $.ajax( {
            type: 'GET',
            contentType: 'application/json',
            dataType: 'json',
            url: '/play/games/' + name + '/lang/info_' + i18n.LANGUAGE + '.json',
            success: function ( data ) {
                try {
                    data.name = name; // throwing this in to be able to identify the game on response event.

                    // Save the response. If this method is called again, we can echo this instead of asking the server again because this data will not change.
                    GameStore.cache.gameInfo[name] = data;

                    // Dispatch a success
                    this.dispatchGameInfoLoaded( { data: data } );
                } catch ( e ) {
                    let state = {
                        hasErrors: function () {
                            return true;
                        },
                        hasUncaughtException: function () {
                            return true;
                        },
                        errors: {
                            uncaught_exception: {
                                message: "Error parsing game information file"
                            }
                        }
                    };

                    this.dispatchGameInfoLoaded( { response: state, error: e } );
                    portalConnection.dispatchRequestDone( { response: state } );
                }
            }.bind( this ),
            error: function ( xhr, status, error ) {
                let state = {
                    hasErrors: function () {
                        return true;
                    },
                    hasUncaughtException: function () {
                        return true;
                    },
                    errors: {
                        uncaught_exception: {
                            message: "Error getting game information file"
                        }
                    }
                };

                this.dispatchGameInfoLoaded( { response: state, error: error } );
                portalConnection.dispatchRequestDone( { response: state } );
            }.bind( this )
        } )
    }
};

GameStore.saveQuestionsJson = function ( campaignHash, name, skin, questions ) {
    let fail = false;

    let params = {
        campaignHash: campaignHash,
        type: 'game',
        assets: {}
    };

    if ( questions ) {
        try {
            params.assets.questions = {
                assetFile: '/assets/' + i18n.LANGUAGE + '/questions.json',
                assetSrc: toBase64( questions )
            }
        } catch ( e ) {
            console.error( 'GameStore.saveQuestionsJson.failed', e );
            fail = true;
        }
    } else {
        fail = true;
    }

    if ( fail ) {
        let state = {
            hasErrors: function () {
                return true;
            },
            hasUncaughtException: function () {
                return true;
            },
            errors: {
                uncaught_exception: {
                    message: "error_saving_questions_data"
                }
            }
        };

        this.dispatchQuestionsJsonSaved( state );
        portalConnection.dispatchRequestDone( { response: state } );
    } else {
        portalConnection.send( { 
            method: '/campaign/custom/upload', 
            params: params, 
            onSuccess: this.dispatchQuestionsJsonSaved, 
            onError: this.dispatchQuestionsJsonSaved 
        } );
    }
};

GameStore.saveQuestionsToServer = function ( campaignHash, questions ) {
    SaveState.dispatchSaveStateUpdate( { state: SaveState.STATE_SAVING } );

    let params = {
        campaignHash: campaignHash,
        gameData: questions.map( function ( question ) {
            return {
                gameType: "SURVEY",
                details: question
            }
        } )
    };

    portalConnection.send( { 
        method: '/campaign/game/submit-game-data', 
        params: params, 
        onSuccess: this.dispatchQuestionsSavedToServer, 
        onError: this.dispatchQuestionsSavedToServer 
    } );
};

GameStore.getLibrary = function ( gameName, campaignHash ) {
    // Check if we have already made this request and cached a successful response. If so, just dispatch that instead of asking the server again.
    if (GameStore.cache.gameLibrary[gameName]) {
        // Dispatch the cached copy. 
        // Do this in a very short timeout because this is expected to be an asynchronous call. 
        // We don't want the event firing before the calling function has even finished executing as it may cause a different behaviour if the event happens async or sync.
        setTimeout( () => {
            this.dispatchLibraryLoaded( { state: GameStore.cache.gameLibrary[gameName] } );
        }, 1 );
    } else {
        let tryagain = 0;

        function request() {
            tryagain++;
            $.ajax( {
                type: 'GET',
                contentType: 'application/json',
                dataType: 'json',
                url: '/campaignplay/' + campaignHash + '/games/' + gameName + '/library.json?nocache=' + Math.random( 9999 ),
                success: function ( data ) {
                    try {
                        this.cache.gameLibrary = data;
                        this.dispatchLibraryLoaded( { state: data } )
                    } catch ( e ) {
                        this.dispatchLibraryLoaded( { state: data, error: e } );
                    }
                }.bind( this ),
                error: function ( xhr, status, error ) {
                    if ( tryagain > 3 ) {
                        let state = {
                            hasErrors: function () {
                                return true;
                            },
                            hasUncaughtException: function () {
                                return true;
                            },
                            errors: {
                                uncaught_exception: {
                                    message: "Error getting game library"
                                }
                            }
                        };

                        this.dispatchLibraryLoaded( { response: state, error: error } );
                        portalConnection.dispatchRequestDone( { response: state } );
                    } else {
                        request.bind( this )();
                    }
                }.bind( this )
            } );
        }

        request.bind( this )();
    }
};

GameStore.loadQuestions = function ( gameName, lang, campaignHash ) {
    var tryagain = 0;

    function request() {
        tryagain++;
        $.ajax( {
            type: 'GET',
            contentType: 'application/json',
            dataType: 'json',
            url: '/campaignplay/' + campaignHash + '/games/' + gameName + '/assets/' + lang + '/questions.json?nocache=' + Math.random( 9999 ),
            success: function ( data ) {
                try {
                    this.dispatchQuestionsLoaded( { state: data } )
                } catch ( e ) {
                    this.dispatchQuestionsLoadError( { state: data, error: e } );
                }
            }.bind( this ),
            error: function ( xhr, status, error ) {
                if ( tryagain > 3 ) {
                    let state = {
                        hasErrors: function () {
                            return true;
                        },
                        hasUncaughtException: function () {
                            return true;
                        },
                        errors: {
                            uncaught_exception: {
                                message: "Error getting game questions file"
                            }
                        }
                    };

                    this.dispatchQuestionsLoadError( { response: state, error: error } );
                    portalConnection.dispatchRequestDone( { response: state } );
                } else {
                    request.bind( this )();
                }
            }.bind( this )
        } );
    }

    request.bind( this )();
};

GameStore.loadDescriptor = function (gameName, skin, campaignHash) {
    var tryagain = 0;

    function request(context) {
        tryagain++;
        $.ajax({
            type: 'GET',
            contentType: 'application/json',
            dataType: 'json',
            url: '/campaignplay/' + campaignHash + '/games/' + gameName + '/skins/' + campaignHash + '/gamedescriptor.json?nocache=' + Math.random( 9999 ),
            success: function (data) {
                try {
                    context.dispatchDescriptorLoaded({state: data})
                } catch (ex) {
                    context.dispatchDescriptorLoadError({state: data, error: ex});
                }
            }.bind(context),
            error: function (xhr, status, error) {
                if (tryagain > 3) {
                    var state = {
                        hasErrors: function () {
                            return true;
                        },
                        hasUncaughtException: function () {
                            return true;
                        },
                        errors: {
                            uncaught_exception: {
                                message: "Error getting game descriptor file"
                            }
                        }
                    };

                    context.dispatchDescriptorLoadError({response: state, error: error});
                    portalConnection.dispatchRequestDone({response: state});
                } else {
                    request(context);
                }
            }.bind(context)
        });
    }

    request(this);
};

GameStore.loadLanguageFile = function (lang, gameName, campaignHash) {
    var tryagain = 0;

    function request(context) {
        tryagain++;
        $.ajax({
            type: 'GET',
            dataType: 'text',
            url: "/campaignplay/" + campaignHash + "/games/" + gameName + "/lang/gamedescriptor_" + lang + ".yaml?nocache=" + Math.random( 9999 ),
            cache: false,
            success: function (data) {
                try {
                    var langFile = YAML.parse(data);
                    context.dispatchLanguageFileLoaded({yaml: langFile})
                } catch (ex) {
                    context.dispatchLanguageFileLoadError({yaml: data, error: ex});
                }
            }.bind(context),
            error: function (xhr, status, error) {
                if (tryagain > 3) {
                    var state = {
                        hasErrors: function () {
                            return true;
                        },
                        hasUncaughtException: function () {
                            return true;
                        },
                        errors: {
                            uncaught_exception: {
                                message: "Error getting game language file"
                            }
                        }
                    };
                    context.dispatchLanguageFileLoadError( { response: state, error: error } );
                    portalConnection.dispatchRequestDone( { response: state } );
                } else {
                    request(context);
                }
            }.bind(context)
        });
    }

    request(this);
};

GameStore.loadThemeDescriptor = function ( campaignHash ) {
    var tryagain = 0;

    function request( context ) {
        $.ajax( {
            type: 'GET',
            contentType: 'application/json',
            dataType: 'json',
            url: '/campaignplay/' + campaignHash + '/core/preload/loader/conf/loader.json?nocache=' + Math.random( 9999 ),
            success: function ( data ) {
                try {
                    context.dispatchGameThemeDescriptorLoaded( { descriptor: data } )
                } catch (ex) {
                    context.dispatchGameThemeDescriptorError( { descriptor: data, error: ex } );
                }
            }.bind( context ),
            error: function ( xhr, status, error ) {
                tryagain++;
                if ( tryagain > 3 ) {
                    var state = {
                        hasErrors: function () { return false; }, //silent fail
                        hasUncaughtException: function () { return true; },
                        errors: {
                            uncaught_exception: {
                                message: "Error getting game theme descriptor file"
                            }
                        }
                    };

                    context.dispatchGameThemeDescriptorLoaded( { error: state, descriptor: {} } );
                    // context.dispatchGameThemeDescriptorError( { response: state, error: error } );
                    portalConnection.dispatchRequestDone( { response: state } );
                } else {
                    request( context );
                }
            }.bind( context )
        } );
    }

    request( this );
};

GameStore.loadGameData = function ( gameName, campaignHash ) {
    var tryagain = 0;

    function request(context) {
        $.ajax({
            type: 'GET',
            contentType: 'application/json',
            dataType: 'json',
            url: "/campaignplay/" + campaignHash + "/games/" + gameName + "/gamedata.json?nocache=" + Math.random( 9999 ),
            success: function (data) {
                try {
                    context.dispatchGameDataLoaded({gamedata: data})
                } catch (ex) {
                    context.dispatchGameDataLoadError({gamedata: data, error: ex});
                }
            }.bind(context),
            error: function (xhr, status, error) {
                tryagain++;
                if (tryagain > 3) {
                    var state = {
                        hasErrors: function () {
                            return true;
                        },
                        hasUncaughtException: function () {
                            return true;
                        },
                        errors: {
                            uncaught_exception: {
                                message: "Error getting game data file"
                            }
                        }
                    };

                    context.dispatchGameDataLoadError({response: state, error: error});
                    portalConnection.dispatchRequestDone({response: state});
                } else {
                    request(context);
                }
            }.bind(context)
        });
    }

    request(this);
};

GameStore.initializeGameSkin = function (gameName, gameSkin, campaignHash) {
    SaveState.dispatchSaveStateUpdate({state: SaveState.STATE_SAVING});
    var requestObject = {
        'campaignHash': campaignHash,
        'gameName': gameName,
        'gameSkin': gameSkin
    };
    portalConnection.send( { 
        method: 'campaign/custom/game/initialize', 
        params: requestObject, 
        onSuccess: this.dispatchGameSkinInitialized, 
        onError: this.dispatchGameSkinInitializeError 
    } );
};

GameStore.saveCustomSkin = function ( assets, gameName, gameSkin, campaignHash ) {
    SaveState.dispatchSaveStateUpdate( { state: SaveState.STATE_SAVING } );

    var types = {
        gameDescriptor: {
            path: '/skins/' + campaignHash + '/gamedescriptor.json'
        },
        questions: {
            path: '/assets/' + i18n.LANGUAGE + '/questions.json'
        }
    };

    var params = {
        campaignHash: campaignHash,
        type: 'game',
        // gameInfo: {
        //     gameName: gameName,
        //     gameSkin: gameSkin
        // },
        assets: {}
    };

    let fails = Object.keys( types ).filter( function ( key ) {
        let type = types[ key ];

        if ( assets[ key ] ) {
            try {
                params.assets[ key ] = {
                    assetFile: type.path,//'/skins/' + campaignHash + '/gamedescriptor.json',
                    assetSrc: toBase64( assets[ key ] )
                };

                return false;
            } catch ( e ) {
                return true;
            }
        }
    }, this );

    if ( fails.length ) {
        console.log( 'GameStore.saveCustomSkin.failed', fails );
        let state = {
            hasErrors: function () {
                return true;
            },
            hasUncaughtException: function () {
                return true;
            },
            errors: {
                uncaught_exception: {
                    message: "error_saving_game_data"
                }
            }
        };

        this.dispatchCustomSkinSaved( state );
        portalConnection.dispatchRequestDone( { response: state } );
    } else {
        portalConnection.send( {
            method: '/campaign/custom/upload', 
            params: params, 
            onSuccess: this.dispatchCustomSkinSaved, 
            onError: this.dispatchCustomSkinSaveError 
        } );
    }
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