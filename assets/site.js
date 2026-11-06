(() => {
  'use strict';

  document.documentElement.classList.add('js');

  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#site-navigation');

  if (menuToggle && navigation) {
    const mobileNavigation = window.matchMedia('(max-width: 960px)');
    let viewportWidth = window.innerWidth;

    const setMenuOpen = (open) => {
      const isOpen = Boolean(open && mobileNavigation.matches);
      navigation.classList.toggle('is-open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    };

    menuToggle.hidden = false;
    setMenuOpen(false);

    menuToggle.addEventListener('click', () => {
      setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
    });

    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) setMenuOpen(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });

    document.addEventListener('click', (event) => {
      if (!navigation.contains(event.target) && !menuToggle.contains(event.target)) {
        setMenuOpen(false);
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth !== viewportWidth) {
        viewportWidth = window.innerWidth;
        setMenuOpen(false);
      }
    });
  }

  const resourceControls = document.querySelector('[data-resource-controls]');
  const resourceSearch = document.querySelector('#resource-search');
  const resourceCategory = document.querySelector('#resource-category');
  const resourceReset = document.querySelector('#resource-reset');
  const resourceCount = document.querySelector('#resource-count');
  const resourceEmpty = document.querySelector('#resource-empty');

  if (resourceControls && resourceSearch && resourceCategory && resourceReset && resourceCount && resourceEmpty) {
    const normalize = (value) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
    const resources = Array.from(document.querySelectorAll('[data-resource-card]'), (card) => ({
      card,
      text: normalize(card.textContent || ''),
      categories: (card.dataset.category || '').split(/\s+/),
    }));

    const filterResources = () => {
      const terms = normalize(resourceSearch.value).split(' ').filter(Boolean);
      const selectedCategory = resourceCategory.value;
      let visibleCount = 0;

      resources.forEach(({ card, text, categories }) => {
        const matchesCategory = selectedCategory === 'all' || categories.includes(selectedCategory);
        const matchesSearch = terms.every((term) => text.includes(term));
        const visible = matchesCategory && matchesSearch;
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      resourceCount.textContent = `${visibleCount} of ${resources.length} resources shown`;
      resourceEmpty.hidden = visibleCount !== 0;
    };

    resourceSearch.addEventListener('input', filterResources);
    resourceCategory.addEventListener('change', filterResources);
    resourceReset.addEventListener('click', () => {
      resourceSearch.value = '';
      resourceCategory.value = 'all';
      filterResources();
      resourceSearch.focus();
    });

    resourceControls.hidden = false;
    filterResources();
  }

  const inquiryForm = document.querySelector('form#general-inquiry');

  // Hidden form markup is retained for deployment detection until the service is enabled.
  // Leave it untouched so unavailable form handling is never presented as an active workflow.
  if (inquiryForm instanceof HTMLFormElement && !inquiryForm.hidden && !inquiryForm.closest('[hidden]') && window.fetch && window.FormData && window.URLSearchParams) {
    const submitButton = inquiryForm.querySelector('button[type="submit"]');
    if (!submitButton) return;

    const originalButtonContent = submitButton.innerHTML;
    const status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    status.tabIndex = -1;
    status.hidden = true;
    submitButton.insertAdjacentElement('afterend', status);
    let submitting = false;

    inquiryForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (submitting || !inquiryForm.reportValidity()) return;

      submitting = true;
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.textContent = 'Sending inquiry…';
      status.hidden = false;
      status.classList.remove('is-error');
      status.textContent = 'Sending your general inquiry. Please wait.';

      try {
        const formData = new FormData(inquiryForm);
        const body = new URLSearchParams();
        formData.forEach((value, key) => {
          if (typeof value === 'string') body.append(key, value);
        });

        const response = await fetch(inquiryForm.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: body.toString(),
          credentials: 'same-origin',
          referrerPolicy: 'no-referrer',
        });

        if (!response.ok) throw new Error('The form service did not confirm delivery.');

        status.textContent = 'Your inquiry was sent. Opening the confirmation page…';
        window.location.assign(inquiryForm.action);
      } catch {
        submitting = false;
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
        submitButton.innerHTML = originalButtonContent;
        status.classList.add('is-error');
        const emailLink = document.createElement('a');
        emailLink.href = 'mailto:info@careforvets.com';
        emailLink.textContent = 'info@careforvets.com';
        status.replaceChildren(
          document.createTextNode('We could not confirm delivery. Your entries are still here. Try again, or send a general question to '),
          emailLink,
          document.createTextNode('.'),
        );
        status.focus();
      }
    });
  }
})();
