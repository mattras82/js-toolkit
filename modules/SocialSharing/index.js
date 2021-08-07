"use strict";
require('./styles.scss');
import PFBase from '../../lib/PFBase';

class SocialSharing extends PFBase {

  constructor() {
    super('[data-social-links]', 'SocialSharing');
    return this;
  }

  init($containers) {
    $containers.forEach($container => {
      if ($container.dataset.title && $container.dataset.url) {
        let networks = this.getNetworks($container);
        let $links = this.getNodes('[data-popup]', $container);
        $links.forEach($link => {
          if (!$link.socialSharing) {
            if ($link.dataset.popup === 'email') {
              return $link.href = networks[$link.dataset.popup];
            }
            $link.addEventListener('click', () => {
              this.openPopup(networks[$link.dataset.popup], $container.dataset.title);
            });
            $link.socialSharing = true;
          }
        });
      }
    });
  }

  getNetworks($container) {
    let postData = {
      title: encodeURIComponent($container.dataset.title),
      url: encodeURIComponent($container.dataset.url)
    };
    if ($container.dataset.desc) {
      postData.desc = encodeURIComponent($container.dataset.desc);
    }
    if ($container.dataset.src) {
      postData.src = encodeURIComponent($container.dataset.src);
    }
    let br = encodeURIComponent('\r\n');
    return {
      facebook: `https://www.facebook.com/sharer.php?u=${postData.url}`,
      twitter: `https://twitter.com/intent/tweet?url=${postData.url}&text=${postData.title}`,
      linkedin: `https://linkedin.com/shareArticle?mini=true&url=${postData.url}&title=${postData.title}` + (postData.desc ? `&summary=${postData.desc}` : '') + (postData.src ? `&source=${postData.src}` : ''),
      email: `mailto:?to=&subject=${postData.title}&body=${postData.url}` + (postData.desc ? `${br}${postData.desc}` : '')
    };
  }

  openPopup(network, title) {
    let c = void 0 !== window.screenLeft ? window.screenLeft : screen.left
      , d = void 0 !== window.screenTop ? window.screenTop : screen.top
      , e = 640
      , f = 400
      , g = screen.width / 2 - e / 2 + c
      , h = screen.height / 2 - f / 2 + d;
    window.open(network, title, "toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=" + e + ",height=" + f + ",top=" + h + ",left=" + g);
  }

  static getName() {
    return 'SocialSharing';
  }
}

export { SocialSharing };