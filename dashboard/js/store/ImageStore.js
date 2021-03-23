let ImageStore = {}

ImageStore.uploadImageAssets = function ( campaignHash, assets, onSuccess ) {
    portalConnection.send( {
        method: 'campaign/custom/upload', 
        params: { campaignHash: campaignHash, assets: assets },
        onSuccess: onSuccess 
    } );
};

module.exports = ImageStore;
