import {
  Toolkit,
  LazyMedia,
  Lightbox,
  SmoothScroll,
  SocialSharing,
  Cookies
} from "../index";

Toolkit.add(LazyMedia);
Toolkit.add(Lightbox);
Toolkit.add(SmoothScroll);
Toolkit.add(SocialSharing);

let config = {
  "debug": false,
  "env": {
    "development": true,
    "production": false
  },
  "theme": {
    "name": "Public Function WordPress Starter Theme",
    "short_name": "pf-starter",
    "description": "This is a WordPress theme developed by Public Function"
  },
  "styles": {
    "icon": {
      "path": "./_src/images/",
      "name": "icon"
    },
    "sass": {
      "theme_color": "#349bd7",
      "theme_palette": {
        "primary": "$theme_color",
        "secondary": "#767676",
        "success": "#3adb76",
        "warning": "#ffae00",
        "alert": "#cc4b37"
      },
      "theme_breakpoints": {
        "small": "0",
        "medium": "640px",
        "large": "1024px",
        "xlarge": "1200px",
        "xxlarge": "1440px"
      },
      "theme_font_sizes": {
        "h1": {
          "font-size": 48
        },
        "h2": {
          "font-size": 40
        },
        "h3": {
          "font-size": 31
        },
        "h4": {
          "font-size": 25
        },
        "h5": {
          "font-size": 20
        },
        "h6": {
          "font-size": 16
        }
      },
      "components": {
        "gutenberg": true,
        "lightbox": true,
        "social-sharing": false,
        "smooth-scroll": false
      }
    },
    "image": {
      "sizes": {
        "pf-preview-admin": {
          "width": 100,
          "height": 100,
          "crop": true
        }
      }
    }
  },
  "use_customizer": true,
  "use_metaboxer": true,
  "use_custom_post_types": true,
  "use_pwa": true,
  "wpcf7_includes": "all",
  "use_jquery_migrate": false,
  "version": "2.0.4",
  "build": "9a2v6w7"
};
Toolkit.addConfig(config);
// import {Config} from "../lib/ConfigLoader";
// console.log('here\s the config', Config);
// // import {ConfigLoader as Toolkit} from '../index';
// // Toolkit.init(config);
// Config.init(config);