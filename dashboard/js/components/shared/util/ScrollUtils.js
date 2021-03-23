module.exports = {
    smoothScroll: function ( elementId, callback ) {
        // If the parent is telling us to scroll to the next error, figure out where to go.
        // Each component can handle what info it needs to store and reference to decide what the next best error to scroll to is.
        // (There might be more than one). In this components case, all the errors that are being checked are in the prize table
        // so just scroll there.

            let el = document.getElementById(elementId)

            if (el) {
                let topBarHeight = $("#topbar").height();
                let actionBarHeight = $("#actionbar").height();


                let rect = el.getBoundingClientRect();
                let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                let top = rect.top + scrollTop - (topBarHeight + actionBarHeight);

                $('html, body').animate({scrollTop:top},'100');
                callback();
            }
    }
}