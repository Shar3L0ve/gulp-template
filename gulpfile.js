let project_folder = 'dist',
  source_folder = 'src';

let path = {
  build: {
    html: `${project_folder}/`,
    style: `${project_folder}/css/`,
    js: `${project_folder}/js/`,
    images: `${project_folder}/images/`,
    fonts: `${project_folder}/fonts/`,
  },
  vendor: {
    css: `${source_folder}/vendor/css/**/*.css`,
    js: `${source_folder}/vendor/js/**/*.js`,
  },
  source: {
    html: [`${source_folder}/**/*.html`, `!${source_folder}/**/_*.html`],
    style: `${source_folder}/scss/main.scss`,
    js: [`${source_folder}/js/main.js`, `${source_folder}/js/vendor.js`],
    images: [`${source_folder}/images/**/*.{png,jpg,svg,webp,gif,ico}`],
    fonts: `${source_folder}/fonts/*.ttf`,
  },
  watch: {
    html: `${source_folder}/**/*.html`,
    style: `${source_folder}/scss/**/*.scss`,
    js: `${source_folder}/js/**/*.js`,
    images: `${source_folder}/images/**/*.{png|jpg|svg|webp|gif|ico}`,
  },
  clean: `./${project_folder}/`,
};

const { src, dest, series, parallel, watch, task } = require('gulp');
const browsersync = require('browser-sync').create();
const fileinclude = require('gulp-file-include');
const del = require('del');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const svgsprite = require('gulp-svg-sprite');
const ttf2woff = require('gulp-ttf2woff');
const babel = require('gulp-babel');
const prettyhtml = require('gulp-pretty-html');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;

sass.compiler = require('node-sass');

html = () => {
  return src(path.source.html, { allowEmpty: true })
    .pipe(fileinclude())
    .pipe(prettyhtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.reload({ stream: true }));
};

style = () => {
  return src(path.source.style, { allowEmpty: true })
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(postcss([cssnano()]))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(dest(path.build.style))
    .pipe(browsersync.reload({ stream: true }));
};

js = () => {
  return src(path.source.js, { allowEmpty: true })
    .pipe(fileinclude())
    .pipe(
      babel({
        presets: ['@babel/env'],
      }),
    )
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(dest(path.build.js))
    .pipe(browsersync.reload({ stream: true }));
};

images = () => {
  return src(path.source.images)
    .pipe(webp({ quality: 70 }))
    .pipe(dest(path.build.images))
    .pipe(src(path.source.images))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 3,
      }),
    )
    .pipe(dest(path.build.images))
    .pipe(src(path.source.images))
    .pipe(dest(path.build.images))
    .pipe(browsersync.reload({ stream: true }));
};

fonts = () => {
  return src(path.source.fonts, { allowEmpty: true })
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
    .pipe(browsersync.reload({ stream: true }));
};

cssVendor = () => {
  return src(path.vendor.css)
    .pipe(concat('vendor.css'))
    .pipe(dest(path.build.style))
    .pipe(browsersync.reload({ stream: true }));
};

jsVendor = () => {
  return src(path.vendor.js)
    .pipe(concat('vendor.js'))
    .pipe(dest(path.build.js))
    .pipe(browsersync.reload({ stream: true }));
};

task('svgStack', () => {
  return src([`${source_folder}/images/stack/*.svg`])
    .pipe(
      svgsprite({
        mode: {
          stack: {
            sprite: 'sprite.svg',
          },
        },
      }),
    )
    .pipe(dest(path.build.images))
    .pipe(browsersync.reload({ stream: true }));
});

WatchFiles = () => {
  watch([path.watch.html], html);
  watch([path.watch.style], style);
  watch([path.watch.js], js);
  watch([path.watch.images], images);
  watch([path.vendor.js], jsVendor);
  watch([path.vendor.css], cssVendor);
};

Clean = () => {
  return del(path.clean);
};

BrowserSync = () => {
  browsersync.init({
    server: {
      baseDir: path.clean,
    },
    port: 3000,
    notify: false,
  });
};

exports.default = series(
  Clean,
  parallel(images, fonts, jsVendor, cssVendor, js, style, html),
  parallel(WatchFiles, BrowserSync),
);
