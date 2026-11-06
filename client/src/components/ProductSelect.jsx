import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFormatCurrency } from '../contexts/CurrencyContext';

export default function ProductSelect({
  products,
  value,
  onChange,
  ariaLabel = 'Pilih handphone',
}) {
  const formatCurrency = useFormatCurrency();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 260,
    maxHeight: 300,
  });

  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const listboxId = useId();

  const selected = products.find((product) => product.id === value) || products[0];
  const selectedIndex = Math.max(
    0,
    products.findIndex((product) => product.id === value)
  );

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 252), window.innerWidth - 24);
    const estimatedHeight = Math.min(products.length * 58 + 58, 320);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < estimatedHeight + 16 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(180, openUp ? spaceAbove - 20 : spaceBelow - 20);
    const menuHeight = Math.min(estimatedHeight, maxHeight);

    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = window.innerWidth - width - 12;
    }
    left = Math.max(12, left);

    const top = openUp
      ? Math.max(12, rect.top - menuHeight - 8)
      : Math.min(rect.bottom + 8, window.innerHeight - menuHeight - 12);

    setPosition({ left, top, width, maxHeight });
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePosition();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleViewportChange = () => updatePosition();

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    requestAnimationFrame(() => menuRef.current?.focus({ preventScroll: true }));

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const option = menuRef.current?.querySelector(
      `[data-option-index="${activeIndex}"]`
    );
    option?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const openMenu = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  const choose = (id) => {
    onChange(id);
    closeMenu();
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) {
        closeMenu();
      } else {
        openMenu();
      }
    }
  };

  const handleMenuKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % products.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + products.length) % products.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(products.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(products[activeIndex].id);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className={`group flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-all ${
          open
            ? 'border-cyan-400/60 bg-cyan-400/[0.08] shadow-[0_0_0_3px_rgba(34,211,238,0.08)]'
            : 'border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]'
        }`}
      >
        <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#eef1f3] to-[#c4c9ce]">
          <img
            src={selected.image}
            alt=""
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-white">
            {selected.name}
          </span>
          <span className="block text-[10px] text-cyan-300/80">
            {formatCurrency(selected.price)}
          </span>
        </span>

        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 shrink-0 text-white/40 transition-transform duration-200 ${
            open ? 'rotate-180 text-cyan-300' : ''
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            tabIndex={-1}
            aria-activedescendant={
              products[activeIndex] ? `${listboxId}-option-${products[activeIndex].id}` : undefined
            }
            onKeyDown={handleMenuKeyDown}
            style={{
              position: 'fixed',
              left: position.left,
              top: position.top,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
            className="z-[80] overflow-y-auto rounded-2xl border border-white/15 bg-[#0b111c]/95 p-1.5 shadow-[0_24px_70px_rgba(0,0,0,0.65)] backdrop-blur-2xl animate-dropdown-in focus:outline-none"
          >
            <div className="flex items-center justify-between px-2.5 py-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                Pilih handphone
              </span>
              <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
                {products.length}
              </span>
            </div>

            {products.map((product, index) => {
              const isSelected = product.id === value;
              const isActive = index === activeIndex;

              return (
                <button
                  key={product.id}
                  type="button"
                  role="option"
                  id={`${listboxId}-option-${product.id}`}
                  data-option-index={index}
                  aria-selected={isSelected}
                  onClick={() => choose(product.id)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-cyan-400/15 text-white'
                      : isActive
                        ? 'bg-white/[0.08] text-white'
                        : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#eef1f3] to-[#c4c9ce]">
                    <img
                      src={product.image}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">
                      {product.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-white/40">
                      <span>{product.brand}</span>
                      <span className="h-0.5 w-0.5 rounded-full bg-white/30" />
                      <span className="text-cyan-300/80">{formatCurrency(product.price)}</span>
                    </span>
                  </span>

                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-400 text-[#04111c]'
                        : 'border-white/15 text-transparent'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
