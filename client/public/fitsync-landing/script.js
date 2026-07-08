document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Header Scroll Effect ---------- */
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  /* ---------- Activate Hero SVG Animations ---------- */
  const heroSvg = document.querySelector('.hero-svg-animated');
  if (heroSvg) {
    // Small delay so animations play after initial paint
    requestAnimationFrame(() => {
      setTimeout(() => {
        heroSvg.classList.add('anim-active');
      }, 200);
    });
  }

  /* ---------- Scroll Reveal (Spring Physics) ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      } else {
        entry.target.classList.remove('in-view');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- Staggered Parent Reveal ---------- */
  const staggerParents = document.querySelectorAll('.stagger-parent');
  const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const children = entry.target.querySelectorAll('.stagger-item');
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        children.forEach((child, index) => {
          child.style.transitionDelay = `${index * 0.15}s`;
        });
      } else {
        entry.target.classList.remove('in-view');
        children.forEach((child) => {
          child.style.transitionDelay = `0s`;
        });
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  staggerParents.forEach(p => staggerObserver.observe(p));

  /* ---------- Active Nav Link Tracking ---------- */
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  if (sections.length && navLinks.length) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' });

    sections.forEach(section => navObserver.observe(section));
  }

  /* ---------- Spotlight Card Hover Effect ---------- */
  document.querySelectorAll('.spotlight-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  /* ---------- 3D Tilt Card (Hero Pill) ---------- */
  document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; 
      const y = e.clientY - rect.top; 
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -8;
      const rotateY = ((x - centerX) / centerX) * 8;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    });
  });

  /* ---------- Magnetic Buttons ---------- */
  document.querySelectorAll('[data-magnetic]').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left) - rect.width / 2;
      const y = (e.clientY - rect.top) - rect.height / 2;
      btn.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = `translate(0px, 0px)`;
    });
  });

  /* ---------- Ripple Click Effect ---------- */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousedown', function(e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.marginLeft = ripple.style.marginTop = `-${size/2}px`;
      
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  /* ---------- Routine Tracker Counter Animation ---------- */
  const trackerBox = document.querySelector('.bento-tracker');
  if (trackerBox) {
    const pctSpan = trackerBox.querySelector('.pct');
    const fillBar = trackerBox.querySelector('.progress-bar .fill');
    let countInterval;

    // Red -> Orange -> Yellow -> Green as percent climbs from 0 to 100
    const colorForPercent = (pct) => {
      const hue = (pct / 100) * 120; // 0 = red, 60 = yellow, 120 = green
      return `hsl(${hue}, 80%, 45%)`;
    };

    const animateTracker = (isIntersecting) => {
      if (isIntersecting) {
        // Start count animation
        let current = 0;
        const target = 96;
        const duration = 1500; // 1.5s
        const stepTime = Math.abs(Math.floor(duration / target));

        // Reset fill bar to animate
        fillBar.style.width = '0%';
        fillBar.style.background = colorForPercent(0);
        pctSpan.style.color = colorForPercent(0);
        // Force reflow
        fillBar.offsetHeight;
        fillBar.style.width = '96%';

        clearInterval(countInterval);
        countInterval = setInterval(() => {
          current += 1;
          const color = colorForPercent(current);
          fillBar.style.background = color;
          pctSpan.style.color = color;
          if (current >= target) {
            pctSpan.textContent = `${target}%`;
            clearInterval(countInterval);
          } else {
            pctSpan.textContent = `${current}%`;
          }
        }, stepTime);
      } else {
        // Reset when out of view (so it re-animates next time)
        clearInterval(countInterval);
        pctSpan.textContent = '0%';
        fillBar.style.width = '0%';
        fillBar.style.background = colorForPercent(0);
        pctSpan.style.color = colorForPercent(0);
      }
    };

    const trackerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        animateTracker(entry.isIntersecting);
      });
    }, { threshold: 0.15 });

    trackerObserver.observe(trackerBox);
  }
});
