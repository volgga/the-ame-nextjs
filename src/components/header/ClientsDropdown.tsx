"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CLIENT_LINKS } from "@/lib/navLinks";

type ClientsDropdownProps = {
  triggerClassName: string;
  isActive?: boolean;
};

export function ClientsDropdown({ triggerClassName }: ClientsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
    }
  }, [open]);

  const handleOpen = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setOpen(true);
  };

  const handleClose = () => {
    closeTimeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  const close = () => setOpen(false);

  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(pointer: coarse)");
    setIsTouch(m.matches);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const firstHref = CLIENT_LINKS[0]?.href ?? "/delivery-and-payments";

  // Вычисляем позицию для портала
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open || !mounted || !containerRef.current) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 20, // fixed positioning - no scroll offset needed
        left: rect.left + rect.width / 2,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, mounted]);

  const dropdownContent = open && position && mounted ? (
    <div
      ref={dropdownRef}
      id="clients-dropdown-menu"
      role="menu"
      aria-labelledby="clients-dropdown-trigger"
      className="fixed z-[200]"
      style={{
        transform: "translateX(-50%)",
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <div
        className="overflow-hidden bg-white transition-all duration-200 ease-out border border-[#1F2A1F]"
        style={{
          padding: "22px 26px",
          width: "fit-content",
          borderRadius: "22px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(-8px)",
          transition: "opacity 200ms ease-out, transform 200ms ease-out",
        }}
      >
        <div className="flex flex-col" style={{ gap: "12px", minWidth: 180 }}>
          {CLIENT_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              className="block py-0.5 text-sm text-color-text-secondary hover:text-color-text-main hover:underline decoration-2 underline-offset-2 transition-colors leading-tight"
              onClick={close}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        ref={containerRef}
        className="relative"
        onMouseEnter={isTouch ? undefined : handleOpen}
        onMouseLeave={isTouch ? undefined : handleClose}
      >
        <Link
          href={firstHref}
          className={triggerClassName}
          aria-expanded={open}
          aria-haspopup="true"
          aria-controls="clients-dropdown-menu"
          id="clients-dropdown-trigger"
          onClick={
            isTouch
              ? (e) => {
                  e.preventDefault();
                  setOpen((v) => !v);
                }
              : undefined
          }
        >
          Клиентам
        </Link>
      </div>
      {mounted && dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
}
