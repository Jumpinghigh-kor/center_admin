import { useState, useEffect } from 'react';

interface UseSearchOptions<T = any> {
  onSearch: (searchData: T) => void;
  initialSearchData?: T;
}

export const useSearch = <T = any>({ onSearch, initialSearchData = {} as T }: UseSearchOptions<T>) => {
  const [isSearch, setIsSearch] = useState(false);
  const [searchData, setSearchData] = useState(initialSearchData);

  // 검색 실행
  const handleSearch = () => {
    setIsSearch(true);
  };

  // 검색 초기화
  const handleReset = () => {
    setSearchData(initialSearchData);
    setIsSearch(true);
  };

  // 검색 데이터 업데이트
  const updateSearchData = (field: keyof T, value: any) => {
    setSearchData((prev: T) => ({
      ...prev,
      [field]: value
    }));
  };

  // isSearch가 true일 때만 검색 실행
  useEffect(() => {
    if (isSearch) {
      onSearch(searchData);
      setIsSearch(false);
    }
  }, [isSearch, searchData, onSearch]);

  return {
    searchData,
    setSearchData,
    isSearch,
    handleSearch,
    handleReset,
    updateSearchData
  };
};
