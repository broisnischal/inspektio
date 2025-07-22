<script lang="ts">
	import { onMount } from "svelte";

	interface Cookie {
		name: string;
		value: string;
		domain: string;
		path: string;
		secure: boolean;
		httpOnly: boolean;
		sameSite: 'strict' | 'lax' | 'no_restriction';
		expirationDate?: number;
		hostOnly: boolean;
		session: boolean;
		storeId: string;
	} 

	let cookies = $state<Cookie[]>([]);
	let filteredCookies = $state<Cookie[]>([]);
	let loading = $state(false);
	let searchTerm = $state("");
	let selectedDomain = $state("all");
	let showExpiredOnly = $state(false);
	let selectedCookies = $state<Set<string>>(new Set());
	let sortField = $state<keyof Cookie>("name");
	let sortDirection = $state<"asc" | "desc">("asc");

	// Get unique domains for filter dropdown
	let domains = $derived(() => {
		const uniqueDomains = [...new Set(cookies.map(c => c.domain))].sort();
		return ["all", ...uniqueDomains];
	});

	// Apply filters and sorting
	$effect(() => {
		let filtered = cookies;

		// Search filter
		if (searchTerm) {
			filtered = filtered.filter(cookie => 
				cookie.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				cookie.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
				cookie.domain.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		// Domain filter
		if (selectedDomain !== "all") {
			filtered = filtered.filter(cookie => cookie.domain === selectedDomain);
		}

		// Expired filter
		if (showExpiredOnly) {
			const now = Date.now() / 1000;
			filtered = filtered.filter(cookie => 
				cookie.expirationDate && cookie.expirationDate < now
			);
		}

		// Sort
		filtered.sort((a, b) => {
			const aVal = a[sortField];
			const bVal = b[sortField];
			
			let comparison = 0;
			if (aVal < bVal) comparison = -1;
			if (aVal > bVal) comparison = 1;
			
			return sortDirection === "desc" ? -comparison : comparison;
		});

		filteredCookies = filtered;
	});

	async function fetchCookies() {
		loading = true;
		try {
			// For Chrome extension context
			if (typeof chrome !== 'undefined' && chrome.cookies) {
				const allCookies = await chrome.cookies.getAll({});
				cookies = allCookies as Cookie[];
			} else {
				// Fallback for development/testing - get document cookies
				const documentCookies = document.cookie.split(';').map(cookie => {
					const [name, ...valueParts] = cookie.trim().split('=');
					return {
						name: name || '',
						value: valueParts.join('=') || '',
						domain: window.location.hostname,
						path: '/',
						secure: false,
						httpOnly: false,
						sameSite: 'lax' as const,
						hostOnly: true,
						session: true,
						storeId: '0'
					};
				}).filter(c => c.name);
				cookies = documentCookies;
			}
		} catch (error) {
			console.error('Failed to fetch cookies:', error);
		} finally {
			loading = false;
		}
	}

	async function deleteCookie(cookie: Cookie) {
		if (typeof chrome !== 'undefined' && chrome.cookies) {
			try {
				await chrome.cookies.remove({
					url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
					name: cookie.name,
					storeId: cookie.storeId
				});
				await fetchCookies(); // Refresh
			} catch (error) {
				console.error('Failed to delete cookie:', error);
			}
		}
	}

	async function deleteSelectedCookies() {
		const promises = filteredCookies
			.filter(cookie => selectedCookies.has(`${cookie.domain}-${cookie.name}`))
			.map(cookie => deleteCookie(cookie));
		
		await Promise.all(promises);
		selectedCookies.clear();
	}

	function toggleCookieSelection(cookie: Cookie) {
		const key = `${cookie.domain}-${cookie.name}`;
		if (selectedCookies.has(key)) {
			selectedCookies.delete(key);
		} else {
			selectedCookies.add(key);
		}
		selectedCookies = new Set(selectedCookies); // Trigger reactivity
	}

	function toggleAllSelection() {
		if (selectedCookies.size === filteredCookies.length) {
			selectedCookies.clear();
		} else {
			selectedCookies = new Set(
				filteredCookies.map(cookie => `${cookie.domain}-${cookie.name}`)
			);
		}
	}

	function formatExpiry(expirationDate?: number): string {
		if (!expirationDate) return "Session";
		const date = new Date(expirationDate * 1000);
		const now = new Date();
		const isExpired = date < now;
		return `${date.toLocaleDateString()} ${date.toLocaleTimeString()} ${isExpired ? '(Expired)' : ''}`;
	}

	function setSortField(field: keyof Cookie) {
		if (sortField === field) {
			sortDirection = sortDirection === "asc" ? "desc" : "asc";
		} else {
			sortField = field;
			sortDirection = "asc";
		}
	}

	onMount(async () => {
		await fetchCookies();
	});
</script>

<div class="cookie-dashboard">
	<div class="header">
		<h2>Cookie Management Studio</h2>
		<div class="actions">
			<button onclick={fetchCookies} disabled={loading} class="">
				{loading ? 'Loading...' : 'Refresh Cookies'}
			</button>
			{#if selectedCookies.size > 0}
				<button onclick={deleteSelectedCookies} class="btn-danger">
					Delete Selected ({selectedCookies.size})
				</button>
			{/if}
		</div>
	</div>

	<div class="filters">
		<input 
			bind:value={searchTerm} 
			placeholder="Search cookies..." 
			class="search-input"
		/>
		
		<select bind:value={selectedDomain} class="domain-filter">
			{#each domains as domain}
				<option value={domain}>
					{domain === "all" ? "All Domains" : domain}
				</option>
			{/each}
		</select>

		<label class="checkbox-label">
			<input type="checkbox" bind:checked={showExpiredOnly} />
			Show expired only
		</label>

		<div class="stats">
			Total: {cookies.length} | Filtered: {filteredCookies.length}
		</div>
	</div>

	<div class="table-container overflow-auto no-scrollbar h-100">
		<table class="cookies-table">
			<thead>
				<tr>
					<th>
						<input 
							type="checkbox" 
							checked={selectedCookies.size === filteredCookies.length && filteredCookies.length > 0}
							onchange={toggleAllSelection}
						/>
					</th>
					<th onclick={() => setSortField('name')} class="sortable">
						Name {sortField === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
					</th>
					<th onclick={() => setSortField('value')} class="sortable">
						Value {sortField === 'value' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
					</th>
					<!-- <th onclick={() => setSortField('domain')} class="sortable">
						Domain {sortField === 'domain' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
					</th>
					<th onclick={() => setSortField('path')} class="sortable">
						Path {sortField === 'path' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
					</th>
					<th>Expires</th>
					<th>Flags</th>
					<th>Actions</th> -->
				</tr>
			</thead>
			<tbody>
				{#each filteredCookies as cookie (cookie.domain + cookie.name)}
					<tr class="cookie-row">
						<td>
							<input 
								type="checkbox" 
								checked={selectedCookies.has(`${cookie.domain}-${cookie.name}`)}
								onchange={() => toggleCookieSelection(cookie)}
							/>
						</td>
						<!-- <td class="cookie-name" title={cookie.name}>
							{cookie.name}
						</td> -->
						<td class="cookie-value" title={cookie.value}>
							{cookie.value.length > 50 ? cookie.value.substring(0, 50) + '...' : cookie.value}
						</td>
						<td class="cookie-domain">
							{cookie.domain}
						</td>
						<!-- <td class="cookie-path">
							{cookie.path}
						</td>
						<td class="cookie-expiry">
							{formatExpiry(cookie.expirationDate)}
						</td> -->
						<td class="cookie-flags">
							<div class="flags">
								{#if cookie.secure}<span class="flag secure">S</span>{/if}
								{#if cookie.httpOnly}<span class="flag httponly">H</span>{/if}
								{#if cookie.sameSite !== 'no_restriction'}<span class="flag samesite">{cookie.sameSite[0].toUpperCase()}</span>{/if}
							</div>
						</td> 
						<!-- <td class="cookie-actions">
							<button onclick={() => deleteCookie(cookie)} class="btn-delete" title="Delete cookie">
								🗑️
							</button>
						</td> -->
					</tr>
				{:else}
					<tr>
						<td colspan="8" class="no-data">
							{loading ? 'Loading cookies...' : 'No cookies found'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
