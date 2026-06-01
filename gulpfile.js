// ============================================
// GULPFILE.JS — полная исправленная версия
// ============================================

// дефолтные переменные gulp
const { src, dest, watch, parallel, series } = require('gulp');

// объявление переменных пакетов
const pug          = require('gulp-pug');
const webpHTML     = require('gulp-webp-html');
const htmlclean    = require('gulp-htmlclean');
const sass         = require('gulp-sass')(require('sass'));
const sassGlob     = require('gulp-sass-glob');
const cleanCSS     = require('gulp-clean-css');      // вместо устаревшего minify-css
const autoprefixer = require('gulp-autoprefixer');
const webpCss      = require('gulp-webp-css');
const imagemin     = require('gulp-imagemin');
const webp         = require('gulp-webp');
const changed      = require('gulp-changed');
const newer        = require('gulp-newer');          // для изображений (лучше чем changed)
const server       = require('gulp-server-livereload');
const clean        = require('gulp-clean');
const fs           = require('fs');
const rename       = require('gulp-rename');
const sourceMaps   = require('gulp-sourcemaps');
const plumber      = require('gulp-plumber');
const notify       = require('gulp-notify');
const webpack      = require('webpack-stream');
// const babel     = require('gulp-babel');          // раскомментируй если нужен

// ============================================
// ПУТИ К ФАЙЛАМ (реорганизовано)
// ============================================
const paths = {
    // Pug
    pug: {
        src: ['./app/**/*.pug', '!./app/blocks/**/*.pug'],
        watch: './app/**/*.pug'
    },
    
    // Sass
    sass: {
        src: './app/src/sass/*.sass',
        watch: './app/src/sass/**/*.sass',
        dest: './app/css',
        destMin: './app/css-min'
    },
    
    // JavaScript
    js: {
        src: './app/src/js/*.js',
        watch: './app/src/js/**/*.js',
        dest: './app/js-bundle',
        webpackConfig: './webpack.config.js'
    },
    
    // Images
    images: {
        src: './app/src/images/**/*',
        dest: './app/images-min',
        watch: './app/src/images/**/*'
    },
    
    // Другое
    fonts: {
        src: './app/fonts/**/*',
        dest: './dist/fonts'
    },
    
    files: {
        src: './app/files/**/*',
        dest: './dist/files'
    },
    
    // Для билда
    build: {
        html: './app/**/*.html',
        css: './app/css-min/**/*.css',
        js: './app/js-bundle/*.js',
        images: './app/images-min/**/*',
        dist: './dist'
    }
};

// ============================================
// НАСТРОЙКИ
// ============================================

// настройки сервера
const serverOptions = {
    livereload: true,
    open: true,
    port: 3000
};

// функция настроек plumber (для красивых ошибок)
const plumberNotify = (title) => {
    return {
        errorHandler: notify.onError({
            title: title,
            message: 'Error <%= error.message %>',
            sound: false
        })
    };
};

// ============================================
// ТАСКИ
// ============================================

// Pug → HTML
function pugTask() {
    return src(paths.pug.src)
        .pipe(plumber(plumberNotify('Pug')))
        .pipe(pug({ pretty: true }))
        .pipe(webpHTML())           // конвертация ссылок на изображения в .webp
        .pipe(htmlclean())          // минификация HTML
        .pipe(dest('./app/'));
}

// Sass → CSS (с expanded и min версиями)
function sassTask() {
    return src(paths.sass.src)
        .pipe(plumber(plumberNotify('Sass')))
        .pipe(sourceMaps.init())
        .pipe(sassGlob())           // поддержка glob импортов
        .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
        .pipe(autoprefixer())       // вендорные префиксы
        .pipe(webpCss())            // конвертация url() в .webp
        .pipe(sourceMaps.write())
        .pipe(dest(paths.sass.dest)) // expanded версия
        
        // Минифицированная версия
        .pipe(cleanCSS())
        .pipe(rename({ extname: '.min.css' }))
        .pipe(sourceMaps.write())
        .pipe(dest(paths.sass.destMin));
}

// JavaScript (Webpack)
function jsTask() {
    return src(paths.js.src)
        .pipe(plumber(plumberNotify('Js')))
        .pipe(changed(paths.js.dest))
        .pipe(webpack(require(paths.js.webpackConfig)))
        .pipe(dest(paths.js.dest));
}

// Изображения: WebP + сжатие оригиналов
function imagesTask(done) {
    // 1. Конвертация в WebP
    src(paths.images.src)
        .pipe(newer(paths.images.dest))
        .pipe(webp())
        .pipe(dest(paths.images.dest));
    
    // 2. Сжатие оригиналов (jpg, png, svg, gif)
    src(paths.images.src)
        .pipe(newer(paths.images.dest))
        .pipe(imagemin({
            verbose: true,
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }]
        }))
        .pipe(dest(paths.images.dest));
    
    done();
}

// LiveReload сервер
function serverTask() {
    return src('./app/')
        .pipe(server(serverOptions));
}

// Очистка папки dist
function cleanTask(done) {
    if (fs.existsSync('./dist/')) {
        return src('./dist/', { read: false, allowEmpty: true })
            .pipe(clean({ force: true }));
    }
    done();
}

// Очистка временных папок в app (опционально)
function cleanAppTask(done) {
    const foldersToClean = ['./app/css-min', './app/images-min', './app/js-bundle'];
    foldersToClean.forEach(folder => {
        if (fs.existsSync(folder)) {
            src(folder, { read: false, allowEmpty: true })
                .pipe(clean({ force: true }));
        }
    });
    done();
}

// ============================================
// ТАСКИ ДЛЯ БИЛДА (копирование в dist)
// ============================================

function buildHtmlTask() {
    return src(paths.build.html)
        .pipe(dest(paths.build.dist));
}

function buildCssTask() {
    return src(paths.build.css)
        .pipe(dest(paths.build.dist + '/css-min'));
}

function buildJsTask() {
    return src(paths.build.js)
        .pipe(dest(paths.build.dist + '/js-bundle'));
}

function buildImagesTask() {
    return src(paths.build.images)
        .pipe(dest(paths.build.dist + '/images-min'));
}

function buildFontsTask() {
    return src(paths.fonts.src)
        .pipe(dest(paths.fonts.dest));
}

function buildFilesTask() {
    return src(paths.files.src)
        .pipe(dest(paths.files.dest));
}

// ============================================
// WATCH (слежение за изменениями)
// ============================================
function watchTask() {
    watch(paths.sass.watch, sassTask);
    watch(paths.pug.watch, pugTask);
    watch(paths.js.watch, jsTask);
    watch(paths.images.watch, imagesTask);
}

// ============================================
// ЭКСПОРТ ТАСКОВ (для вызова из терминала)
// ============================================

// Отдельные таски
exports.pug = pugTask;
exports.sass = sassTask;
exports.js = jsTask;
exports.images = imagesTask;
exports.clean = cleanTask;
exports.cleanApp = cleanAppTask;

// Режим разработки (default)
exports.default = series(
    parallel(pugTask, sassTask, jsTask, imagesTask),
    parallel(serverTask, watchTask)
);

// Режим сборки (build)
exports.build = series(
    cleanTask,
    parallel(buildHtmlTask, buildCssTask, buildJsTask, buildImagesTask, buildFontsTask, buildFilesTask)
);

// Полная пересборка с очисткой app (редко)
exports.fullClean = series(cleanAppTask, cleanTask, exports.default);