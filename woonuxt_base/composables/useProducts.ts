let allProducts = [] as Product[];

export function useProducts() {
  // Declare the state variables and the setter functions
  const products = useState<Product[]>('products', () => []);

  // Set the products state and the allProducts variable
  function setProducts(newProducts: Product[]): void {
    console.log('setProducts - useProducts');
    if (!Array.isArray(newProducts)) throw new Error('Products must be an array.');
    try {
      products.value = newProducts;
      allProducts = JSON.parse(JSON.stringify(newProducts));
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * get all products from the api, it's a recursive function that will fetch all products
   * @param {string} category - the category to filter by (optional)
   * @param {string} after - the cursor to start fetching from
   * @param {Product[]} tempArray - the array to store the products in
   * @returns {Promise<Product[]>} - an array of all products
   */
  const getAllProducts = async (category: string = '', after: string = '', tempArray: Product[] = []): Promise<any> => {
    console.log('getAllProducts - useProducts');
    try {
      const payload = category ? { after, slug: category } : { after };
      const { data }: any = await useAsyncGql('getProducts', payload);
      const newProducts = data?.value?.products?.nodes || [];
      tempArray = [...tempArray, ...newProducts];

      if (data?.value?.products?.pageInfo?.hasNextPage) {
        console.log('Getting more products');
        return getAllProducts(category, data.value.products.pageInfo.endCursor, tempArray);
      } else {
        return tempArray;
      }
    } catch (error) {
      console.error(error);
      return tempArray;
    }
  };

  const updateProductList = async (): Promise<void> => {
    console.log('updateProductList - useProducts');

    const { isFiltersActive, filterProducts } = await useFiltering();
    const { isSearchActive, searchProducts } = await useSearching();
    const { isSortingActive, sortProducts } = await useSorting();

    // return all products if no filters are active
    if (!isFiltersActive.value && !isSearchActive.value && !isSortingActive.value) {
      products.value = allProducts;
      return;
    }

    // otherwise, apply filter, search and sorting in that order
    try {
      let newProducts = [...allProducts];
      if (isFiltersActive.value) newProducts = await filterProducts(newProducts);
      if (isSearchActive.value) newProducts = await searchProducts(newProducts);
      if (isSortingActive.value) newProducts = await sortProducts(newProducts);

      products.value = newProducts;
    } catch (error) {
      console.error(error);
    }
  };

  return { products, allProducts, setProducts, updateProductList, getAllProducts };
}
