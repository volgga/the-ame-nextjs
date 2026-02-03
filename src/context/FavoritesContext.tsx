"use client";

import React, { createContext, useContext, useEffect, useReducer } from "react";

const STORAGE_KEY = "theame:favorites";

type FavoritesState = {
  favoriteIds: string[];
};

type FavoritesAction =
  | { type: "INIT"; payload: string[] }
  | { type: "TOGGLE"; payload: string }
  | { type: "CLEAR_ALL" };

const favoritesReducer = (state: FavoritesState, action: FavoritesAction): FavoritesState => {
  switch (action.type) {
    case "INIT":
      return { favoriteIds: action.payload };
    case "TOGGLE": {
      const id = action.payload;
      const next = state.favoriteIds.includes(id)
        ? state.favoriteIds.filter((x) => x !== id)
        : [...state.favoriteIds, id];
      return { favoriteIds: next };
    }
    case "CLEAR_ALL":
      return { favoriteIds: [] };
    default:
      return state;
  }
};

interface FavoritesContextType {
  toggle: (id: string) => void;
  clearAll: () => void;
  isFavorite: (id: string) => boolean;
  count: number;
  items: string[];
}

const NOOP_FAVORITES: FavoritesContextType = {
  toggle: () => {},
  clearAll: () => {},
  isFavorite: () => false,
  count: 0,
  items: [],
};

const FavoritesContext = createContext<FavoritesContextType>(NOOP_FAVORITES);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(favoritesReducer, { favoriteIds: [] });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const ids = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
      dispatch({ type: "INIT", payload: ids });
    } catch {
      dispatch({ type: "INIT", payload: [] });
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.favoriteIds));
    } catch {
      // ignore
    }
  }, [state.favoriteIds]);

  const toggle = (id: string) => {
    dispatch({ type: "TOGGLE", payload: id });
  };

  const clearAll = () => {
    dispatch({ type: "CLEAR_ALL" });
  };

  const isFavorite = (id: string) => state.favoriteIds.includes(id);

  const value: FavoritesContextType = {
    toggle,
    clearAll,
    isFavorite,
    count: state.favoriteIds.length,
    items: state.favoriteIds,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
