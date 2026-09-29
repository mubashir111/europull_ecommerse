const swiper = new Swiper('.swiper', {

  // Long enough to read a slide; pauses while the visitor is interacting.
  autoplay: {
     delay: 6000,
     disableOnInteraction: false,
     pauseOnMouseEnter: true
   },

  // Optional parameters
  direction: 'horizontal',
  slidesPerView: 1,
  loop: true,
  speed: 900,
  mousewheel: false,
  watchSlidesProgress: true,
  parallax: true,
  spaceBetween: -1,

  // If we need pagination
   pagination: {
      el: ".swiper-pagination",
      type: "fraction",
    },

  // Navigation arrows
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },

  watchSlidesProgress: true

});