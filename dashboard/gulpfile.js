var gulp = require( 'gulp' );
var browserify = require( 'browserify' );
var source = require( 'vinyl-source-stream2' );
var buffer = require( 'vinyl-buffer' );
var gutil = require( 'gulp-util' );
var uglify = require( 'gulp-uglify' );
var minify = require( 'gulp-minify' );
var envify = require( 'envify' );
var watchify = require( 'watchify' );
var duration = require( 'gulp-duration' );
var chalk = require( 'chalk' );
var rename = require( 'gulp-rename' );
var notify = require( 'gulp-notify' );
var babelify = require( 'babelify' );
var sass = require( 'gulp-sass' );
var cleanCSS = require( 'gulp-clean-css' );
var clean = require( 'gulp-clean' );
var livereactload = require( 'livereactload' );
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');

var env = process.env.NODE_ENV || 'development';

var config = {
    gamify: {
        src: './js/Gamify.jsx.js',
        srcFile: 'Gamify.jsx.js',
        outputFile: 'gamify.bundle.js',
        outputDir: './js',
        outputVendorFile: 'gamify.vendor.js',
        outputVendorMinFile: 'gamify.vendor.min.js',
        outputVendorDir: './js/vendor',
        langs: [ 'zh-cn', 'zh-tw' ],
        libs: [
            'babel-polyfill',
            'livereactload/babel-transform',
            'react',
            'prop-types',
            'react-dom',
            'react-router',
            'react-color',
            'react-dropzone',
            'underscore',
            'moment',
            'moment-timezone',
            'react-widgets',
            'react-widgets-moment',
            'highcharts',
            'mustache',
            'yamljs',
            'jquery',
            'crypto',
            'unibabel',
            'deepmerge'
        ],
        sass: {
            src: './scss/gamify.scss',
            outputFile: 'gamify.min.css',
            outputDir: './css'
        }
    }
};

config.gamify.langs.forEach( function ( lang ) {
    config.gamify.libs.push( 'moment/locale/' + lang );
} );

gulp.task( 'vendor-gamify', function () {
    return bundleVendor( 'gamify', env === 'production' );
} );

gulp.task( 'watch-gamify', function () {
    var main = watchify( browserify( {
        entries: config.gamify.src,
        bundleExternal: false,
        transform: [ envify, [ babelify, { presets: [ 'es2015', 'react' ], plugins: [ 'transform-object-rest-spread' ] } ] ],
        debug: true,
        cache: {}, packageCache: {}, fullPaths: true
    } ) );

    compileSass( 'gamify' );

    return main
        .on( 'update', function () {
            bundle( main, config.gamify.srcFile, config.gamify.outputFile, config.gamify.outputDir );
            compileSass( 'gamify' );
        } )
        .bundle()
        .pipe( source( config.gamify.outputFile ) )
        .pipe( gulp.dest( config.gamify.outputDir ) );
} );

gulp.task( 'watch-gamify-sass', function () {
    gulp.watch( config.gamify.sass.src + '/**/*.scss', [ 'sass' ] );
} );

gulp.task( 'default', [ 'gamify', 'watch-gamify-sass' ] );

gulp.task( 'sass', [ 'gamify-sass' ] );

gulp.task( 'gamify-sass', function () {
    return compileSass( 'gamify' )
} );

function bundleVendor ( type ) {
    var b = browserify();

    config[ type ].libs.forEach( function ( lib ) { 
        b.require( lib ); 
    } );

    b.transform( envify() );

    return b.bundle()
        .pipe( source( config[ type ].outputVendorFile ) )
        .pipe( buffer() )
        .pipe( uglify() )
        .pipe( minify( { ext: { min: '.js' } } ) )
        .pipe( gulp.dest( config[ type ].outputVendorDir ) );
}

function bundle ( bundler, srcFile, outputFile, outputDir ) {
    var bundleTime = duration( 'bundle time' );

    bundler
        .bundle()
        .on( 'error', mapError )
        .pipe( source( srcFile ) )
        .pipe( bundleTime )
        .pipe( rename( outputFile ) )
        .pipe( gulp.dest( outputDir ) )
        .pipe( notify( {
            message: 'Generated file: <%= file.relative %>'
        } ));
}

function mapError ( err ) {
    if ( err.fileName ) {
        gutil.log( chalk.red( err.name )
            + ': ' + chalk.yellow( err.fileName.replace(__dirname + 'src/js/', '' ) )
            + ': ' + 'Line ' + chalk.magenta( err.lineNumber )
            + ' & ' + 'Column ' + chalk.magenta( err.columnNumber || err.column )
            + ': ' + chalk.blue( err.description ) );
    } else {
        gutil.log( chalk.red( err.name )
            + ': '
            + chalk.yellow( err.message ) );
    }
}

function compileSass ( app ) {
    return gulp.src( config[ app ].sass.src )
        .pipe( sass.sync().on( 'error', sass.logError ) )
        .pipe( postcss([ autoprefixer() ]) )
        .pipe( cleanCSS( { compatibility: 'ie8' } ) )
        .pipe( minify() )
        .pipe( rename( config[ app ].sass.outputFile ) )
        .pipe( gulp.dest( config[ app ].sass.outputDir ) );
}

gulp.task( 'build', [ 'sass', 'build-gamify', 'vendor-gamify' ] );

gulp.task( 'build-gamify', function () {
    var b = browserify( {
        entries: config.gamify.src,
        bundleExternal: false,
        debug: env === 'development',
        transform: [ envify ]
    } );

    b.transform( babelify.configure( { presets: [ 'react', 'es2015' ], plugins: [ 'transform-object-rest-spread' ] } ) );

    return b.bundle()
        .pipe( source( config.gamify.outputFile ) )
        .pipe( buffer() )
        .pipe( uglify() )
        .pipe( minify( { ext: { min: '.js' } } ) )
        .on( 'error', gutil.log )
        .pipe( gulp.dest( config.gamify.outputDir ) );
} );
