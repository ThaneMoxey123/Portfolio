(function () {
  "use strict";

  /* Presence of this class lets CSS hide scroll-reveal content only when
     JS actually runs — no-JS visitors still see everything immediately. */
  document.documentElement.classList.add("js");

  /* Nav goes solid/dark once the page has scrolled past the hero's top edge. */
  var nav = document.getElementById("siteNav");

  function updateNavState() {
    if (window.scrollY > 10) {
      nav.classList.add("is-scrolled");
    } else {
      nav.classList.remove("is-scrolled");
    }
  }

  if (nav) {
    updateNavState();
    window.addEventListener("scroll", updateNavState, { passive: true });
  }

  /* Scroll-down cue nudges the page forward by one viewport height. */
  var scrollCue = document.getElementById("scrollCue");

  if (scrollCue) {
    scrollCue.addEventListener("click", function () {
      window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    });
  }

  /* Any tour video (hero or case study): stays hidden — revealing the CSS
     placeholder behind it — until it actually has a source and starts
     playing. Once a real <source> is uncommented, it fades itself in.
     No other markup or script changes are needed when footage is added. */
  var allVideos = document.querySelectorAll(".hero__video, .case-study__video");

  allVideos.forEach(function (video) {
    video.addEventListener("playing", function () {
      video.classList.add("is-ready");
    });
  });

  /* Case study videos only play while their frame is on screen, so four
     looping clips aren't all decoding at once off-screen. */
  var caseVideos = document.querySelectorAll(".case-study__video");

  if ("IntersectionObserver" in window && caseVideos.length) {
    var playObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(function () {
              /* No source yet, or autoplay was blocked — harmless. */
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.35 }
    );

    caseVideos.forEach(function (video) {
      playObserver.observe(video);
    });
  }

  /* Case study entries fade up into view as the visitor scrolls to them. */
  var caseStudies = document.querySelectorAll(".case-study");

  if ("IntersectionObserver" in window && caseStudies.length) {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    caseStudies.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    caseStudies.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  /* Platform-logo marquee: two `.platforms__group` elements scroll as one
     track from translateX(0) to translateX(-50%), which only stays
     seamless if each group's rendered width is at least as wide as the
     marquee itself — otherwise the track runs out of content before the
     loop point and a gap opens up on the trailing edge. A single set of
     4 short wordmarks is narrower than most screens, so this clones the
     base set into each group as many times as needed to comfortably
     cover the current viewport, keeps both groups identical, and sets
     the animation duration from the actual content width so the visual
     speed stays constant no matter how many repeats that turns out to
     be (or how wide real logo <img>s end up being once they replace
     these placeholders). Re-runs on resize and once fonts finish
     loading, since both can change the measured width. */
  var marquee = document.querySelector(".platforms__marquee");
  var track = document.querySelector(".platforms__track");
  var groups = track ? track.querySelectorAll(".platforms__group") : [];

  if (marquee && track && groups.length === 2) {
    var PIXELS_PER_SECOND = 26; // calm, constant crawl speed
    var MIN_REPEATS = 2; // never fewer than the original 2 copies
    var baseSetHTML = groups[0].innerHTML; // the single 4-logo set, captured once

    var layoutMarquee = function () {
      // Reset to one set to get a clean, unrepeated measurement.
      groups[0].innerHTML = baseSetHTML;
      var setWidth = groups[0].getBoundingClientRect().width;
      if (!setWidth) return;

      var containerWidth = marquee.getBoundingClientRect().width;
      var repeats = Math.max(
        MIN_REPEATS,
        Math.ceil(containerWidth / setWidth) + 1
      );

      var repeatedHTML = baseSetHTML.repeat(repeats);
      groups[0].innerHTML = repeatedHTML;
      groups[1].innerHTML = repeatedHTML;

      var halfWidth = groups[0].getBoundingClientRect().width;
      track.style.animationDuration = (halfWidth / PIXELS_PER_SECOND).toFixed(2) + "s";
    };

    layoutMarquee();
    document.fonts.ready.then(layoutMarquee).catch(function () {});

    var resizeTimer;
    window.addEventListener(
      "resize",
      function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(layoutMarquee, 200);
      },
      { passive: true }
    );
  }

  /* Fades a single element up once it scrolls into view — shared by every
     section below that reveals as one block rather than item-by-item
     (case studies use their own per-item version above). */
  function revealOnScroll(selector) {
    var el = document.querySelector(selector);
    if (!el) return;

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries, obs) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      observer.observe(el);
    } else {
      el.classList.add("is-visible");
    }
  }

  revealOnScroll(".how-it-works__steps");
  revealOnScroll(".cta-final__inner");

  /* Contact page form: submits to Formspree via fetch instead of a full
     page reload, so a successful send can swap the form out for an
     inline confirmation message rather than redirecting away. Only runs
     when the form is actually on the page (contact.html). */
  var contactForm = document.getElementById("contactForm");

  if (contactForm) {
    var errorEl = document.getElementById("contactFormError");
    var successEl = document.getElementById("contactFormSuccess");
    var submitBtn = contactForm.querySelector(".contact-form__submit");
    var submitBtnDefaultText = submitBtn ? submitBtn.textContent : "";

    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (errorEl) errorEl.hidden = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }

      fetch(contactForm.action, {
        method: "POST",
        body: new FormData(contactForm),
        headers: { Accept: "application/json" },
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Form submission failed");

          contactForm.hidden = true;
          if (successEl) {
            successEl.hidden = false;
            successEl.setAttribute("tabindex", "-1");
            successEl.focus();
          }
        })
        .catch(function () {
          if (errorEl) errorEl.hidden = false;
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtnDefaultText;
          }
        });
    });
  }
})();
