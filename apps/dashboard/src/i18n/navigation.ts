export {getPathname, redirect, usePathname} from './navigation-base';

// Link and useRouter are wrapped here (not exported from navigation-base
// directly) to mark the clicked element + trigger the top progress bar on
// every navigation — see store/navigation/useNavLoadingStore.ts for why.
export {Link, useRouter} from './navigation-loading';
