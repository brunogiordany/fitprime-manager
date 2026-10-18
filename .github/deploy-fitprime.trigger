Deploy FitPrime production
Reason: isolate document scrolling when an iPhone diary field receives focus, before Save
Application commit: 48c802efb2e21305e4491e574c506fa054965785
Validation on main: standalone build 39131465427 SUCCESS; actual editor focus regression 39131465494 SUCCESS; mobile/desktop shell regression 39131465498 SUCCESS
Actual editor tested in Chromium and WebKit with synthetic data: independent keyboard viewport/pan, input focus before save, six saves, per-set load types, last exercise focus, close/reopen and original scroll restoration
Deployment: Manus Lite exact GitHub main synchronization/checkpoint ONLY, then stop; existing API publishes
No code editing, formatting, programming or refactoring by Manus
After publication: verify-diary-public.yml must confirm focus isolation in actual public JavaScript and CSS
