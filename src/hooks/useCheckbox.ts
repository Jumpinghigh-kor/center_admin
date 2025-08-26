import { useState, useEffect } from 'react';

interface UseCheckboxReturn {
  checkedItems: boolean[];
  allChecked: boolean;
  handleAllCheck: (checked: boolean) => void;
  handleIndividualCheck: (index: number, checked: boolean) => void;
  resetCheckedItems: () => void;
}

export const useCheckbox = (itemCount: number): UseCheckboxReturn => {
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);
  const [allChecked, setAllChecked] = useState<boolean>(false);

  useEffect(() => {
    setCheckedItems(new Array(itemCount).fill(false));
    setAllChecked(false);
  }, [itemCount]);

  const handleAllCheck = (checked: boolean) => {
    setAllChecked(checked);
    setCheckedItems(new Array(itemCount).fill(checked));
  };

  const handleIndividualCheck = (index: number, checked: boolean) => {
    const newCheckedItems = [...checkedItems];
    newCheckedItems[index] = checked;
    setCheckedItems(newCheckedItems);
    
    const allItemsChecked = newCheckedItems.every(item => item);
    setAllChecked(allItemsChecked);
  };

  const resetCheckedItems = () => {
    setCheckedItems(new Array(itemCount).fill(false));
    setAllChecked(false);
  };

  return {
    checkedItems,
    allChecked,
    handleAllCheck,
    handleIndividualCheck,
    resetCheckedItems
  };
}; 