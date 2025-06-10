"use client";

import { useState, useCallback } from "react";
import type {
  HookModalState as ModalState,
  UseModalReturn,
} from "@/types";

/**
 * Custom hook for modal state management used across admin components
 * and other components that need modal/dialog functionality.
 */
export function useModal(initialState: boolean = false): UseModalReturn {
  const [modal, setModal] = useState<ModalState>({
    isOpen: initialState,
    data: undefined,
  });

  const openModal = useCallback((data?: any) => {
    setModal({ isOpen: true, data });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ isOpen: false, data: undefined });
  }, []);

  const toggleModal = useCallback((data?: any) => {
    setModal((prev) => ({
      isOpen: !prev.isOpen,
      data: prev.isOpen ? undefined : data,
    }));
  }, []);

  return {
    isOpen: modal.isOpen,
    data: modal.data,
    openModal,
    closeModal,
    toggleModal,
  };
}

/**
 * Hook for managing multiple modals with string keys
 */
export function useModals() {
  const [modals, setModals] = useState<Record<string, ModalState>>({});

  const openModal = useCallback((key: string, data?: any) => {
    setModals((prev) => ({
      ...prev,
      [key]: { isOpen: true, data },
    }));
  }, []);

  const closeModal = useCallback((key: string) => {
    setModals((prev) => ({
      ...prev,
      [key]: { isOpen: false, data: undefined },
    }));
  }, []);

  const toggleModal = useCallback((key: string, data?: any) => {
    setModals((prev) => {
      const current = prev[key] || { isOpen: false, data: undefined };
      return {
        ...prev,
        [key]: {
          isOpen: !current.isOpen,
          data: current.isOpen ? undefined : data,
        },
      };
    });
  }, []);

  const getModal = useCallback(
    (key: string): ModalState => {
      return modals[key] || { isOpen: false, data: undefined };
    },
    [modals]
  );

  const isModalOpen = useCallback(
    (key: string): boolean => {
      return modals[key]?.isOpen || false;
    },
    [modals]
  );

  const getModalData = useCallback(
    (key: string): any => {
      return modals[key]?.data;
    },
    [modals]
  );

  return {
    openModal,
    closeModal,
    toggleModal,
    getModal,
    isModalOpen,
    getModalData,
  };
}
