const cp = require('child_process');
const path = require('path');

const browserSync = require('browser-sync').create();
const gulp = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const cssnano = require('gulp-cssnano');
const sass = require('gulp-sass');
const imagemin = require('gulp-imagemin');
const svgmin = require('gulp-svgmin');
const pngcrush = require('imagemin-pngcrush');
const size = require('gulp-size');
const plumber = require('gulp-plumber');
const swPrecache = require('sw-precache');

/**
 * Build the Hugo Site
 */
gulp.task('hugo', done => {
  return cp.spawn('hugo').on('close', done);
});

/**
 * Rebuild Hugo & do page reload
 */
gulp.task('hugo-watch', ['hugo'], () => {
  browserSync.reload();
});

gulp.task('minify-css', () => {
  gulp
    .src('./public/assets/styles/style.css') // set this to the file(s) you want to minify.
    .pipe(
      cssnano({
        discardComments: {
          removeAll: true
        }
      })
    )
    .pipe(size({ gzip: false, showFiles: true, title: 'minified css' }))
    .pipe(size({ gzip: true, showFiles: true, title: 'minified css' }))
    .pipe(gulp.dest('./public/assets/styles/'));
});

// Task to optimize and minify svg
gulp.task('minify-svg', () => {
  gulp
    .src('./assets/images/')
    .pipe(svgmin())
    .pipe(gulp.dest('./public/assets/images/'));
});

gulp.task('minify-png', () => {
  gulp
    .src('./assets/images/**/*.png')
    .pipe(size({ gzip: false, showFiles: true, title: 'original image size' }))
    .pipe(size({ gzip: true, showFiles: true, title: 'original image size' }))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        use: [pngcrush()]
      })
    )
    .pipe(size({ gzip: false, showFiles: true, title: 'minified images' }))
    .pipe(size({ gzip: true, showFiles: true, title: 'minified images' }))
    .pipe(gulp.dest('./public/assets/images/')); // change the dest if you don't want your images overwritten
});

gulp.task('image', () => {
  gulp.src('./assets/images/**').pipe(gulp.dest('./public/assets/images/')); // change the dest if you don't want your images overwritten
});

// Task that compiles scss files down to good old css
gulp.task('sass', () => {
  gulp
    .src('./assets/styles/style.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(
      autoprefixer({
        browsers: ['> 5%'],
        cascade: false
      })
    )
    .pipe(gulp.dest('./public/assets/styles/'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('es6', () => {
  gulp
    .src('./assets/scripts/app.js')
    .pipe(plumber())
    .pipe(babel())
    .pipe(gulp.dest('./public/assets/scripts/'))
    .pipe(browserSync.reload({ stream: true }));
});

gulp.task('generate-service-worker', callback => {
  swPrecache.write(
    path.join('public/sw.js'),
    {
      staticFileGlobs: [
        'public/assets/styles/**.css',
        'public/assets/images/**.*',
        'public/assets/scripts/**.js',
        'public/manifest.json'
      ],
      stripPrefix: 'public',
      runtimeCaching: [
        {
          handler: 'cacheFirst',
          urlPattern: /^https:\/\/localhost/
        }
      ]
    },
    callback
  );
});

gulp.task('production', () => {
  gulp.run('minify-css', 'minify-img', 'minify-svg');
});

gulp.task('watch', () => {
  browserSync.init({
    server: {
      baseDir: 'public'
    }
  });
  // Watch .scss files
  gulp.watch('./assets/styles/*.scss', ['sass']);
  // Watch .html files and posts
  gulp.watch(
    ['./content/**/*.md', './content/*.md', './layouts/**/*.html'],
    ['hugo-watch']
  );
});

gulp.task('build', [
  'sass',
  'generate-service-worker',
  'es6',
  'minify-png',
  'minify-svg',
  'hugo'
]);

gulp.task('serve', [
  'generate-service-worker',
  'sass',
  'watch',
  'image',
  'es6',
  'hugo'
]);
