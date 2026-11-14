import { ref } from "vue";
import { errorInfo } from "../api/http";

/**
 * Loads one page of a paginated API list.
 *   const list = usePagedList(({ page, limit }) =>
 *     api.list({ page, limit, status: status.value || undefined }).then((d) => ({ items: d.orders, meta: d.meta })));
 * Call list.load() to fetch, list.reset() to go back to page 1 (after a filter changed), list.goTo(n) to change page.
 */
export function usePagedList(fetcher, { limit = 20 } = {}) {
  const items = ref([]);
  const meta = ref({ page: 1, limit, total: 0, totalPages: 1 });
  const page = ref(1);
  const loading = ref(false);
  const error = ref("");
  let latest = 0;

  async function load() {
    const mine = ++latest;
    loading.value = true;
    error.value = "";
    try {
      const res = await fetcher({ page: page.value, limit });
      if (mine !== latest) return; // a newer request superseded this one
      items.value = res.items;
      meta.value = res.meta;
      if (res.meta.totalPages >= 1 && page.value > res.meta.totalPages) {
        page.value = res.meta.totalPages; // the last item of the last page was removed
        return load();
      }
    } catch (err) {
      if (mine === latest) error.value = errorInfo(err).message;
    } finally {
      if (mine === latest) loading.value = false;
    }
  }

  const goTo = (n) => {
    page.value = n;
    return load();
  };
  const reset = () => {
    page.value = 1;
    return load();
  };

  return { items, meta, page, loading, error, load, goTo, reset };
}
