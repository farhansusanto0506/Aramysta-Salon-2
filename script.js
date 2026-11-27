
const onReady = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
};

window.AramystaReady = true;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Safari/iOS < 14 belum punya MediaQueryList.addEventListener
const onMediaChange = (query, handler) => {
    if (typeof query.addEventListener === 'function') query.addEventListener('change', handler);
    else if (typeof query.addListener === 'function') query.addListener(handler);
};

// sessionStorage bisa diblokir (mode privat / cookie dimatikan)
const safeSession = {
    get(key) {
        try { return window.sessionStorage.getItem(key); } catch (err) { return null; }
    },
    set(key, value) {
        try { window.sessionStorage.setItem(key, value); return true; } catch (err) { return false; }
    },
    remove(key) {
        try { window.sessionStorage.removeItem(key); } catch (err) { /* abaikan */ }
    }
};

const canAnimateOnScroll = () => 'IntersectionObserver' in window && !prefersReducedMotion();

onReady(function () {
    // 1. KONTROL GESER CAROUSEL PORTOFOLIO
    const sliderTrack = document.getElementById('portfolioSliderTrack');
    const prevBtn = document.getElementById('portfolioPrevBtn');
    const nextBtn = document.getElementById('portfolioNextBtn');

    if (sliderTrack) {
        const getScrollStep = () => {
            const firstCard = sliderTrack.querySelector('.portfolio-card');
            return firstCard ? firstCard.offsetWidth + 24 : 340;
        };

        prevBtn?.addEventListener('click', () => {
            sliderTrack.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
        });

        nextBtn?.addEventListener('click', () => {
            sliderTrack.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
        });
    }

    // 2. KONTROL GESER CAROUSEL LAYANAN
    const serviceSliderTrack = document.getElementById('serviceSliderTrack');
    const servicePrevBtn = document.getElementById('servicePrevBtn');
    const serviceNextBtn = document.getElementById('serviceNextBtn');

    if (serviceSliderTrack) {
        const getServiceScrollStep = () => {
            const firstCard = serviceSliderTrack.querySelector('.service-card');
            return firstCard ? firstCard.offsetWidth + 24 : 340;
        };

        servicePrevBtn?.addEventListener('click', () => {
            serviceSliderTrack.scrollBy({ left: -getServiceScrollStep(), behavior: 'smooth' });
        });

        serviceNextBtn?.addEventListener('click', () => {
            serviceSliderTrack.scrollBy({ left: getServiceScrollStep(), behavior: 'smooth' });
        });
    }

    // 4. NAVBAR, SMOOTH SCROLL & SCROLLSPY
    const siteHeader = document.getElementById('siteHeader');
    const menuToggle = document.getElementById('mobileMenuToggle');

    if (siteHeader) {
        let headerTicking = false;
        const updateHeader = () => {
            headerTicking = false;
            const scrollable = document.documentElement.scrollHeight - window.innerHeight;
            const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
            siteHeader.classList.toggle('is-scrolled', window.scrollY > 12);
            siteHeader.style.setProperty('--scroll-progress', progress.toFixed(4));
        };
        const requestHeader = () => {
            if (headerTicking) return;
            headerTicking = true;
            requestAnimationFrame(updateHeader);
        };
        window.addEventListener('scroll', requestHeader, { passive: true });
        window.addEventListener('resize', requestHeader, { passive: true });
        updateHeader();
    }

    if (siteHeader && menuToggle) {
        const setMenu = (open) => {
            siteHeader.classList.toggle('menu-open', open);
            menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            menuToggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
        };
        menuToggle.addEventListener('click', () => setMenu(!siteHeader.classList.contains('menu-open')));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') setMenu(false);
        });
        document.addEventListener('click', (e) => {
            if (!siteHeader.contains(e.target)) setMenu(false);
        });
        onMediaChange(window.matchMedia('(min-width: 1024px)'), () => setMenu(false));
    }

    const navLinks = document.querySelectorAll('.nav-scroll-link');
    const sectionIds = [
        'portofolio-section',
        'tentang-section',
        'koleksi-section',
        'layanan-section',
        'testimoni-section',
        'kontak-section'
    ];

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.dataset.target;
            if (!targetId) return;

            const targetEl = document.getElementById(targetId);
            siteHeader?.classList.remove('menu-open');
            menuToggle?.setAttribute('aria-expanded', 'false');
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

                if (window.location.hash) {
                    history.replaceState(null, '', window.location.pathname);
                }
            } else {
                e.preventDefault();
                if (!safeSession.set('scrollTarget', targetId)) {
                    window.location.href = '/#' + targetId;
                    return;
                }
                window.location.href = '/';
            }
        });
    });

    const pendingTarget = safeSession.get('scrollTarget');
    if (pendingTarget) {
        safeSession.remove('scrollTarget');
        const targetEl = document.getElementById(pendingTarget);
        if (targetEl) {
            setTimeout(() => {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }

    const sections = sectionIds
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if (navLinks.length > 0 && sections.length > 0) {
        let navTicking = false;
        const updateActiveNav = () => {
            navTicking = false;
            const scrollPos = window.scrollY + 140;
            let currentId = sections[0].id;

            sections.forEach(section => {
                if (scrollPos >= section.offsetTop) {
                    currentId = section.id;
                }
            });

            navLinks.forEach(link => {
                if (!link.classList.contains('nav-link')) return;

                const isActive = link.dataset.target === currentId;
                link.classList.toggle('is-active', isActive);
                if (isActive) link.setAttribute('aria-current', 'true');
                else link.removeAttribute('aria-current');
            });
        };

        const requestActiveNav = () => {
            if (navTicking) return;
            navTicking = true;
            requestAnimationFrame(updateActiveNav);
        };

        window.addEventListener('scroll', requestActiveNav, { passive: true });
        window.addEventListener('resize', requestActiveNav, { passive: true });
        updateActiveNav();
    }

    // 5. FORM RESERVASI WHATSAPP
    const waWrapper = document.getElementById('waBookingWrapper');
    if (waWrapper) {
        const waNumber = waWrapper.dataset.waNumber;
        let bookedSchedules = {};
        try {
            bookedSchedules = JSON.parse(waWrapper.dataset.bookedSchedules || '{}');
        } catch (err) {
            bookedSchedules = {};
        }

        const PACKAGES_BY_GROUP = {
            wisuda: {
                hint: 'Paket Wisuda Aramysta MUA',
                items: [
                    'Simple Hairdo (Start 50k)',
                    'Make-up Only (Start 150k)',
                    'All in One Wisuda Package (Start 250k)',
                    'Premium Wisuda Package (Start 600k)'
                ]
            },
            pernikahan: {
                hint: 'Paket Wedding & Pengantin',
                items: [
                    'Paket Wedding Violet (2,5 Jt Nett)'
                ]
            },
            siraman: {
                hint: 'Paket Rias & Busana Siraman',
                items: [
                    'Paket Basic (800k)',
                    'Paket Lengkap (1,5jt)'
                ]
            }
        };

        const detectServiceGroup = (serviceLabel) => {
            const lower = (serviceLabel || '').toLowerCase();
            if (lower.includes('wisuda') || lower.includes('graduation')) return 'wisuda';
            if (lower.includes('pernikahan') || lower.includes('wedding') || lower.includes('pengantin')) return 'pernikahan';
            if (lower.includes('siraman')) return 'siraman';
            return null;
        };

        const waName = document.getElementById('waName');
        const waService = document.getElementById('waService');
        const waPackageContainer = document.getElementById('waPackageContainer');
        const waPackage = document.getElementById('waPackage');
        const waPackageHint = document.getElementById('waPackageHint');
        const waDate = document.getElementById('waDate');
        const waHour = document.getElementById('waHour');
        const waMinute = document.getElementById('waMinute');
        const waLocation = document.getElementById('waLocation');
        const waNotes = document.getElementById('waNotes');

        const scheduleStatusBox = document.getElementById('scheduleStatusBox');
        const summaryName = document.getElementById('summaryName');
        const summaryService = document.getElementById('summaryService');
        const summaryPackageRow = document.getElementById('summaryPackageRow');
        const summaryPackage = document.getElementById('summaryPackage');
        const summarySchedule = document.getElementById('summarySchedule');
        const summaryLocation = document.getElementById('summaryLocation');
        const waMessagePreview = document.getElementById('waMessagePreview');
        const waErrorMsg = document.getElementById('waErrorMsg');
        const sendWaBtn = document.getElementById('sendWaBtn');

        let isDateBooked = false;

        const renderPackageOptions = () => {
            if (!waPackageContainer || !waPackage) return;

            const groupKey = detectServiceGroup(waService?.value || '');
            const groupData = groupKey ? PACKAGES_BY_GROUP[groupKey] : null;

            waPackage.innerHTML = '';

            if (!groupData || !groupData.items.length) {
                waPackageContainer.classList.add('hidden');
                waPackageContainer.classList.remove('flex');
                if (summaryPackageRow) {
                    summaryPackageRow.classList.add('hidden');
                    summaryPackageRow.classList.remove('flex');
                }
                return;
            }

            groupData.items.forEach((pkg) => {
                const option = document.createElement('option');
                option.value = pkg;
                option.textContent = pkg;
                waPackage.appendChild(option);
            });

            if (waPackageHint) waPackageHint.textContent = groupData.hint || '';
            waPackageContainer.classList.remove('hidden');
            waPackageContainer.classList.add('flex');
            if (summaryPackageRow) {
                summaryPackageRow.classList.remove('hidden');
                summaryPackageRow.classList.add('flex');
            }
        };

        const formatIndoDate = (dateStr) => {
            if (!dateStr) return '[Belum dipilih]';
            const date = new Date(dateStr + 'T00:00:00');
            return date.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        };

        const checkAvailability = () => {
            const selectedDate = waDate?.value || '';
            isDateBooked = false;

            if (!selectedDate) {
                scheduleStatusBox?.classList.add('hidden');
                if (sendWaBtn) {
                    sendWaBtn.disabled = false;
                    sendWaBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
                return;
            }

            const slots = bookedSchedules[selectedDate] || [];
            scheduleStatusBox?.classList.remove('hidden');

            if (slots.length > 0) {
                isDateBooked = true;
                const slot = slots[0];
                const noteText = slot.note ? ` (${slot.note})` : '';
                const statusText = slot.type === 'blocked' || !slot.start_time
                    ? 'Tanggal ini tidak tersedia untuk reservasi. Silakan pilih tanggal lain.'
                    : `Tanggal ini sudah penuh / terisi (jadwal mulai pukul ${slot.start_time} WIB${noteText}) dan tidak dapat dipesan lagi. Silakan pilih tanggal lain.`;

                if (scheduleStatusBox) {
                    scheduleStatusBox.className = 'p-4 rounded-xl border border-error/40 bg-error-container/40 text-on-error-container text-xs';
                    scheduleStatusBox.innerHTML = `
                        <div class="flex items-start gap-2 font-semibold">
                            <span class="material-symbols-outlined text-base text-error shrink-0">event_busy</span>
                            <span>${statusText}</span>
                        </div>
                    `;
                }

                if (sendWaBtn) {
                    sendWaBtn.disabled = true;
                    sendWaBtn.classList.add('opacity-50', 'cursor-not-allowed');
                }
            } else {
                if (scheduleStatusBox) {
                    scheduleStatusBox.className = 'p-4 rounded-xl border border-secondary/30 bg-secondary-fixed/30 text-primary text-xs';
                    scheduleStatusBox.innerHTML = `
                        <div class="flex items-center gap-2 font-semibold">
                            <span class="material-symbols-outlined text-base text-secondary">check_circle</span>
                            <span>Tanggal ini masih tersedia untuk reservasi.</span>
                        </div>
                    `;
                }

                if (sendWaBtn) {
                    sendWaBtn.disabled = false;
                    sendWaBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        };

        const buildMessage = () => {
            const rawName = (waName?.value || '').trim();
            const nameVal = rawName || '[Nama Klien]';
            const serviceVal = waService?.value || 'Pengantin Couture';
            const groupKey = detectServiceGroup(serviceVal);
            const hasPackage = Boolean(groupKey && PACKAGES_BY_GROUP[groupKey]);
            const packageVal = hasPackage ? (waPackage?.value || '') : '';
            const dateStr = waDate?.value || '';
            const dateVal = formatIndoDate(dateStr);
            const timeVal = `${waHour?.value || '08'}:${waMinute?.value || '00'} WIB`;
            const rawLocation = (waLocation?.value || '').trim();
            const locationVal = rawLocation
                ? `Kunjungan ke Alamat (${rawLocation})`
                : 'Datang langsung ke Studio Aramysta Salon';
            const notesVal = (waNotes?.value || '').trim();

            if (summaryName) summaryName.textContent = rawName || '-';
            if (summaryService) summaryService.textContent = serviceVal;
            if (summaryPackage) summaryPackage.textContent = packageVal || '-';
            if (summarySchedule) {
                summarySchedule.textContent = dateStr
                    ? `${dateVal} • ${timeVal}`
                    : 'Pilih tanggal terlebih dahulu';
            }
            if (summaryLocation) summaryLocation.textContent = locationVal;

            let message = `Halo *Aramysta Salon*, saya ingin melakukan reservasi jadwal tata rias dengan rincian berikut:\n\n` +
                `• *Nama:* ${nameVal}\n` +
                `• *Layanan:* ${serviceVal}`;

            if (hasPackage && packageVal) {
                message += `\n• *Paket:* ${packageVal}`;
            }

            message += `\n• *Tanggal:* ${dateVal}\n` +
                `• *Jam:* ${timeVal}\n` +
                `• *Lokasi:* ${locationVal}`;

            if (notesVal) {
                message += `\n• *Catatan:* ${notesVal}`;
            }

            message += `\n\nMohon informasi ketersediaan jadwalnya. Terima kasih.`;
            if (waMessagePreview) waMessagePreview.textContent = message;

            checkAvailability();
            return message;
        };

        waService?.addEventListener('change', () => {
            renderPackageOptions();
            waErrorMsg?.classList.add('hidden');
            buildMessage();
        });

        [waName, waPackage, waDate, waHour, waMinute, waLocation, waNotes].forEach(el => {
            el?.addEventListener('input', () => {
                waErrorMsg?.classList.add('hidden');
                buildMessage();
            });
            el?.addEventListener('change', () => {
                waErrorMsg?.classList.add('hidden');
                buildMessage();
            });
        });

        sendWaBtn?.addEventListener('click', () => {
            if (isDateBooked) {
                if (waErrorMsg) {
                    waErrorMsg.textContent = '* Tanggal yang dipilih sudah penuh. Silakan pilih tanggal lain.';
                    waErrorMsg.classList.remove('hidden');
                }
                waDate?.focus();
                return;
            }

            if (!(waName?.value || '').trim() || !(waDate?.value || '')) {
                if (waErrorMsg) {
                    waErrorMsg.textContent = '* Mohon isi Nama Lengkap dan pilih Tanggal Booking terlebih dahulu.';
                    waErrorMsg.classList.remove('hidden');
                }
                if (!(waName?.value || '').trim()) waName?.focus();
                else waDate?.focus();
                return;
            }

            const finalMessage = buildMessage();
            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(finalMessage)}`;
            sendWaBtn.classList.add('is-loading');
            sendWaBtn.setAttribute('aria-busy', 'true');
            window.open(waUrl, '_blank', 'noopener,noreferrer');
            setTimeout(() => {
                sendWaBtn.classList.remove('is-loading');
                sendWaBtn.removeAttribute('aria-busy');
            }, 1200);
        });

        const disabledDates = Object.keys(bookedSchedules);
        if (waDate) {
            flatpickr(waDate, {
                locale: flatpickr.l10ns.id,
                dateFormat: 'Y-m-d',
                altInput: true,
                altFormat: 'l, j F Y',
                minDate: 'today',
                disable: disabledDates,
                onDayCreate: function (dObj, dStr, fp, dayElem) {
                    const dayKey = fp.formatDate(dayElem.dateObj, 'Y-m-d');
                    if (bookedSchedules[dayKey]) {
                        dayElem.classList.add('booked-date');
                        dayElem.title = 'Tanggal sudah terisi';
                    }
                },
                onChange: function () {
                    waErrorMsg?.classList.add('hidden');
                    buildMessage();
                }
            });
        }

        renderPackageOptions();
        buildMessage();
    }

    // 6. ANIMASI SCROLL (berulang)
    // Elemen dianimasikan setiap kali masuk layar, dan direset setelah benar-benar
    // keluar layar, sehingga animasi muncul lagi saat scroll ke bawah maupun ke atas.
    // - Masuk: threshold 0 + rootMargin bawah -8% agar elemen tinggi (HP) / kartu
    //   yang baru terlihat sebagian di carousel tetap terpicu.
    // - Keluar: rootMargin 0 agar reset hanya terjadi saat elemen sudah tak terlihat
    //   (tidak berkedip di tepi layar).
    const STAGGER_MS = 90;
    const CARD_STAGGER_MS = 110;
    const ENTER_OPTIONS = { threshold: 0, rootMargin: '0px 0px -8% 0px' };
    const EXIT_OPTIONS = { threshold: 0, rootMargin: '0px' };

    const clearDelayOnEnd = (el) => {
        el.addEventListener('transitionend', (e) => {
            if (e.target === el && e.propertyName === 'opacity') el.style.transitionDelay = '';
        });
    };
    const showImmediately = (els) => els.forEach((el) => el.classList.add('is-visible'));
    const byPosition = (a, b) => {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return (ra.top - rb.top) || (ra.left - rb.left);
    };

    const observeRepeating = (targets, { onEnter, onExit }) => {
        const enterObserver = new IntersectionObserver((entries) => {
            const entering = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target);
            if (entering.length) onEnter(entering);
        }, ENTER_OPTIONS);

        const exitObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) onExit(entry.target);
            });
        }, EXIT_OPTIONS);

        targets.forEach((el) => {
            enterObserver.observe(el);
            exitObserver.observe(el);
        });
    };

    const hideForReplay = (el) => {
        if (!el.classList.contains('is-visible')) return;
        el.style.transitionDelay = '';
        el.classList.remove('is-visible');
    };

    const revealTargets = document.querySelectorAll('[data-reveal]');

    if (revealTargets.length && canAnimateOnScroll()) {
        revealTargets.forEach(clearDelayOnEnd);

        observeRepeating(revealTargets, {
            onEnter(entering) {
                const groups = new Map();
                entering
                    .filter((el) => !el.classList.contains('is-visible'))
                    .forEach((el) => {
                        const parent = el.parentElement;
                        if (!groups.has(parent)) groups.set(parent, []);
                        groups.get(parent).push(el);
                    });

                groups.forEach((items) => {
                    items.sort(byPosition).forEach((el, i) => {
                        el.style.transitionDelay = `${i * STAGGER_MS}ms`;
                        el.classList.add('is-visible');
                    });
                });
            },
            onExit: hideForReplay
        });
    } else {
        showImmediately(revealTargets);
    }

    // 7. ANIMASI KARTU KARYA & LAYANAN (berulang)
    const cards = document.querySelectorAll('[data-card-reveal]');

    if (cards.length && canAnimateOnScroll()) {
        cards.forEach(clearDelayOnEnd);

        observeRepeating(cards, {
            onEnter(entering) {
                entering
                    .filter((el) => !el.classList.contains('is-visible'))
                    .sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left)
                    .forEach((el, i) => {
                        el.style.transitionDelay = `${i * CARD_STAGGER_MS}ms`;
                        el.classList.add('is-visible');
                    });
            },
            onExit: hideForReplay
        });
    } else {
        showImmediately(cards);
    }

    // 7b. ANIMASI HERO (diputar ulang saat kembali ke atas)
    const heroEls = document.querySelectorAll('.hero-enter, .hero-enter-photo');

    if (heroEls.length && canAnimateOnScroll() && document.documentElement.classList.contains('js-enabled')) {
        observeRepeating(heroEls, {
            onEnter(entering) {
                entering.forEach((el) => el.classList.remove('is-reset'));
            },
            onExit(el) {
                el.classList.add('is-reset');
            }
        });
    }

    // 8. FILTER KATEGORI KARYA
    const filterWrap = document.getElementById('portfolioFilter');

    if (filterWrap && sliderTrack) {
        const chips = filterWrap.querySelectorAll('[data-filter]');
        const portfolioCards = sliderTrack.querySelectorAll('.portfolio-card');
        const emptyState = document.getElementById('portfolioFilterEmpty');
        let filterTimer = null;

        chips.forEach((chip) => {
            chip.addEventListener('click', () => {
                const category = chip.dataset.filter;

                chips.forEach((c) => {
                    const active = c === chip;
                    c.classList.toggle('is-active', active);
                    c.setAttribute('aria-pressed', active ? 'true' : 'false');
                });

                const toHide = [];
                const toShow = [];
                portfolioCards.forEach((card) => {
                    const match = category === 'all' || card.dataset.category === category;
                    if (match && (card.hidden || card.classList.contains('is-filtered-out'))) toShow.push(card);
                    else if (!match && !card.hidden) toHide.push(card);
                });

                toHide.forEach((card) => {
                    card.style.transitionDelay = '';
                    card.classList.add('is-filtered-out');
                });

                clearTimeout(filterTimer);
                filterTimer = setTimeout(() => {
                    toHide.forEach((card) => { card.hidden = true; });
                    toShow.forEach((card) => {
                        card.classList.add('is-filtered-out');
                        card.hidden = false;
                    });

                    const visibleCount = [...portfolioCards].filter((card) => !card.hidden).length;
                    if (emptyState) emptyState.hidden = visibleCount > 0;

                    sliderTrack.scrollTo({ left: 0, behavior: 'auto' });
                    void sliderTrack.offsetWidth;

                    toShow.forEach((card, i) => {
                        card.style.transitionDelay = `${i * 60}ms`;
                        card.classList.remove('is-filtered-out');
                    });
                }, toHide.length ? 300 : 0);
            });
        });
    }

    // 9. COUNTER STATISTIK
    const counters = document.querySelectorAll('[data-count-to]');

    if (counters.length && canAnimateOnScroll()) {
        const runCounter = (el) => {
            const target = parseInt(el.dataset.countTo, 10) || 0;
            const duration = Math.min(1600, 900 + target * 10);
            const ease = (t) => 1 - Math.pow(1 - t, 3);
            const runId = String(Date.now() + Math.random());
            let start = null;

            el.dataset.countRun = runId;
            const isCurrentRun = () => el.dataset.countRun === runId;

            const tick = (now) => {
                if (!isCurrentRun()) return;
                if (start === null) start = now;
                const progress = Math.min((now - start) / duration, 1);
                el.textContent = Math.round(target * ease(progress));
                if (progress < 1) requestAnimationFrame(tick);
            };
            el.textContent = '0';
            setTimeout(() => {
                if (isCurrentRun()) requestAnimationFrame(tick);
            }, 350);
        };

        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const el = entry.target;
                if (entry.intersectionRatio >= 0.6 && !el.dataset.counted) {
                    el.dataset.counted = '1';
                    runCounter(el);
                } else if (!entry.isIntersecting) {
                    // Sudah keluar layar: siap dihitung ulang saat terlihat lagi
                    delete el.dataset.counted;
                }
            });
        }, { threshold: [0, 0.6] });

        counters.forEach((el) => counterObserver.observe(el));
    }

    // 10. PARALLAX RINGAN
    const parallaxEls = document.querySelectorAll('[data-parallax]');

    if (parallaxEls.length) {
        // Hanya di layar besar dengan mouse; dimatikan di HP/tablet agar scroll tetap ringan
        const parallaxQuery = window.matchMedia('(min-width: 1024px) and (hover: hover) and (prefers-reduced-motion: no-preference)');
        let ticking = false;

        const updateParallax = () => {
            ticking = false;
            const viewportMid = window.innerHeight / 2;

            parallaxEls.forEach((el) => {
                if (!parallaxQuery.matches) {
                    el.style.translate = '';
                    return;
                }
                const rect = el.parentElement.getBoundingClientRect();
                if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
                const factor = parseFloat(el.dataset.parallax) || 0;
                const offset = (rect.top + rect.height / 2 - viewportMid) * factor;
                el.style.translate = `0 ${offset.toFixed(1)}px`;
            });
        };

        const requestParallax = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(updateParallax);
        };

        window.addEventListener('scroll', requestParallax, { passive: true });
        window.addEventListener('resize', requestParallax, { passive: true });
        onMediaChange(parallaxQuery, requestParallax);
        updateParallax();
    }
});

// Pilih paket dari kartu layanan ke form reservasi
function selectBookingService(serviceTitle) {
    const serviceSelect = document.getElementById('waService');
    if (!serviceSelect) return;

    const exists = Array.from(serviceSelect.options).some((opt) => opt.value === serviceTitle);
    if (!exists) serviceSelect.add(new Option(serviceTitle, serviceTitle, true, true), 0);
    serviceSelect.value = serviceTitle;
    serviceSelect.dispatchEvent(new Event('change'));
}
