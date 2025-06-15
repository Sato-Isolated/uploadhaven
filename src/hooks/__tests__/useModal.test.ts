import { renderHook, act } from '@testing-library/react';
import { useModal, useModals } from '../useModal';
import { describe, it, expect } from 'vitest';

describe('useModal', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useModal());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should initialize with custom initial state', () => {
    const { result } = renderHook(() => useModal(true));

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should open modal', () => {
    const { result } = renderHook(() => useModal());

    act(() => {
      result.current.openModal();
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should open modal with data', () => {
    const { result } = renderHook(() => useModal());
    const testData = { id: 1, name: 'test' };

    act(() => {
      result.current.openModal(testData);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toEqual(testData);
  });

  it('should close modal', () => {
    const { result } = renderHook(() => useModal(true));

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should toggle modal', () => {
    const { result } = renderHook(() => useModal());

    // Toggle to open
    act(() => {
      result.current.toggleModal();
    });

    expect(result.current.isOpen).toBe(true);

    // Toggle to close
    act(() => {
      result.current.toggleModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should toggle modal with data', () => {
    const { result } = renderHook(() => useModal());
    const testData = { message: 'hello' };

    // Toggle to open with data
    act(() => {
      result.current.toggleModal(testData);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.data).toEqual(testData);

    // Toggle to close (data should be cleared)
    act(() => {
      result.current.toggleModal();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.data).toBeUndefined();
  });
});

describe('useModals', () => {
  it('should initialize with empty modals', () => {
    const { result } = renderHook(() => useModals());

    expect(result.current.isModalOpen('test')).toBe(false);
    expect(result.current.getModalData('test')).toBeUndefined();
  });

  it('should open modal by key', () => {
    const { result } = renderHook(() => useModals());

    act(() => {
      result.current.openModal('test');
    });

    expect(result.current.isModalOpen('test')).toBe(true);
    expect(result.current.getModalData('test')).toBeUndefined();
  });

  it('should open modal with data by key', () => {
    const { result } = renderHook(() => useModals());
    const testData = { userId: 123 };

    act(() => {
      result.current.openModal('userModal', testData);
    });

    expect(result.current.isModalOpen('userModal')).toBe(true);
    expect(result.current.getModalData('userModal')).toEqual(testData);
  });

  it('should close modal by key', () => {
    const { result } = renderHook(() => useModals());

    // First open the modal
    act(() => {
      result.current.openModal('test', { data: 'value' });
    });

    expect(result.current.isModalOpen('test')).toBe(true);

    // Then close it
    act(() => {
      result.current.closeModal('test');
    });

    expect(result.current.isModalOpen('test')).toBe(false);
    expect(result.current.getModalData('test')).toBeUndefined();
  });

  it('should toggle modal by key', () => {
    const { result } = renderHook(() => useModals());

    // Toggle to open
    act(() => {
      result.current.toggleModal('toggleTest');
    });

    expect(result.current.isModalOpen('toggleTest')).toBe(true);

    // Toggle to close
    act(() => {
      result.current.toggleModal('toggleTest');
    });

    expect(result.current.isModalOpen('toggleTest')).toBe(false);
  });

  it('should manage multiple modals independently', () => {
    const { result } = renderHook(() => useModals());

    // Open first modal
    act(() => {
      result.current.openModal('modal1', { type: 'first' });
    });

    // Open second modal
    act(() => {
      result.current.openModal('modal2', { type: 'second' });
    });

    expect(result.current.isModalOpen('modal1')).toBe(true);
    expect(result.current.isModalOpen('modal2')).toBe(true);
    expect(result.current.getModalData('modal1')).toEqual({ type: 'first' });
    expect(result.current.getModalData('modal2')).toEqual({ type: 'second' });

    // Close only first modal
    act(() => {
      result.current.closeModal('modal1');
    });

    expect(result.current.isModalOpen('modal1')).toBe(false);
    expect(result.current.isModalOpen('modal2')).toBe(true);
    expect(result.current.getModalData('modal2')).toEqual({ type: 'second' });
  });

  it('should return false for non-existent modal keys', () => {
    const { result } = renderHook(() => useModals());

    expect(result.current.isModalOpen('nonExistent')).toBe(false);
    expect(result.current.getModalData('nonExistent')).toBeUndefined();
  });

  it('should get modal state object', () => {
    const { result } = renderHook(() => useModals());
    const testData = { value: 'test' };

    act(() => {
      result.current.openModal('testModal', testData);
    });

    const modalState = result.current.getModal('testModal');
    expect(modalState).toEqual({
      isOpen: true,
      data: testData,
    });
  });
});
