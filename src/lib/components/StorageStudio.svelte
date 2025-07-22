<script lang="ts">
  import { onMount } from "svelte";

  let idbData: any = null;
  let localStorageData: Record<string, string> = $state({});
  let error = "";

  onMount(async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      //   // Fetch IndexedDB
      //   const idbResult: any = await new Promise((resolve) => {
      //     chrome.tabs.sendMessage(tab.id!, { type: "GET_INDEXEDDB" }, (res) => {
      //       resolve(res);
      //     });
      //   });

      //   if ("error" in idbResult) {
      //     error = idbResult.error;
      //   } else {
      //     idbData = idbResult;
      //   }

      console.log(tab);

      // Fetch localStorage
      const localResult: any = await new Promise((resolve) => {
        chrome.tabs.sendMessage(
          tab.id!,
          { type: "GET_LOCALSTORAGE" },
          (res) => {
            resolve(res);
          }
        );
      });

      console.log("testing");

      console.log(localResult);

      localStorageData = localResult.localStorage;
    } catch (err) {
      error = String(err);
    }
  });
</script>

<!-- LOCALSTORAGE -->
<!-- {#if localStorageData && Object.keys(localStorageData).length > 0}
  <div class="mt-6 border-t pt-4">
    <h2 class="text-xl font-semibold">🗂 localStorage</h2>
    <table class="table-auto text-left text-sm w-full border mt-1">
      <thead>
        <tr><th>Key</th><th>Value</th></tr>
      </thead>
      <tbody>
        {#each Object.entries(localStorageData) as [key, value]}
          <tr>
            <td class="font-mono font-semibold">{key}</td>
            <td class="font-mono">{value}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div> 
{/if} -->

<div>
  Storage

  <pre>
        {JSON.stringify(localStorageData, null, 2)}
    </pre>
</div>
