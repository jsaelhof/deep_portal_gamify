

module.exports = {
    findFileInDescriptor: function ( gameDescriptor, id ) {
        let files = gameDescriptor.files.skin;
        for ( let i=0; i<files.length; i++ ) {
            if (files[i].id === id) {
                return {...files[i]};
            }
        }
    }
}