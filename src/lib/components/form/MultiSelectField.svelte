<script lang="ts" context="module">
	type Rec = Record<string, unknown>;
</script>

<script lang="ts" generics="T extends Rec">
	import { fly } from 'svelte/transition';

	import { type SuperForm, arrayProxy, type FormPathArrays } from 'sveltekit-superforms';
	import { createSelect, melt, type SelectOption } from '@melt-ui/svelte';
	import { type Writable } from 'svelte/store';
	import Icon from '../icon/Icon.svelte';
	import HiddenInput from './HiddenInput.svelte';

	type DropdownOption = { display: string; value: string | number };
	export let form: SuperForm<T, App.Superforms.Message>;
	export let field: FormPathArrays<T>;
	export let labelText: string = '';
	export let dropdownOptions: ReadonlyArray<DropdownOption>;
	export let allSelectedText: string | undefined;
	export let noneSelectedText: string | undefined = undefined;

	let { values } = arrayProxy(form, field) as { values: Writable<(string | number)[]> };

	const {
		elements: { trigger, menu, option, label },
		states: { open },
		helpers: { isSelected },
	} = createSelect({
		forceVisible: true,
		positioning: {
			placement: 'bottom',
			fitViewport: true,
			sameWidth: true,
		},
		multiple: true,
		preventScroll: false,
		defaultSelected: $values.map((v) => ({
			value: v,
			label: String(v),
		})),
		onSelectedChange: handleSelectedChange,
	});

	function handleSelectedChange(args: {
		curr: SelectOption<string | number>[] | undefined;
		next: SelectOption<string | number>[] | undefined;
	}): SelectOption<string | number>[] | undefined {
		if (!args.next) {
			return undefined;
		}
		values.set(args.next.map((v) => v.value));
		return args.next;
	}

	$: selected = dropdownOptions.filter((v) => $isSelected(v.value));
</script>

{#each $values as sel}
	<HiddenInput name={field} value={sel} />
{/each}

<!-- TODO This styling is messy; refactor with ComboboxInput.svelte -->
<div class="flex flex-col gap-1 whitespace-nowrap">
	<!-- svelte-ignore a11y-label-has-associated-control - $label contains the 'for' attribute -->
	<label use:melt={$label}>{labelText}</label>
	<button
		class="flex input round multiselect-padding items-center justify-between"
		use:melt={$trigger}
		aria-label="Options"
	>
		<span class="flex flex-wrap gap-2 min-w-[220px]">
			{#if $values.length === 0}
				<span class="chip">{noneSelectedText ?? allSelectedText ?? 'None'}</span>
			{:else if $values.length === dropdownOptions.length && allSelectedText !== undefined}
				<span class="chip">{allSelectedText}</span>
			{:else if $values.length <= 2}
				{#each selected as selectedItem}
					<span class="chip">{selectedItem.display}</span>
				{/each}
			{:else}
				<span class="chip">{selected[0].display}</span>
				{#if $values.length !== 1}
					<span class="chip">+{$values.length - 1} more</span>
				{/if}
			{/if}
		</span>

		<Icon name="chevronDown" />
	</button>
	{#if $open}
		<div
			class="ring-1 ring-[#c2c1ca] dark:ring-[#686775] z-[99999] overflow-y-auto overflow-x-hidden flex gap-1 max-h-[300px] flex-col whitespace-nowrap rounded-lg p-1 input"
			use:melt={$menu}
			transition:fly={{ duration: 150, y: -5 }}
		>
			{#each dropdownOptions as dropdownOption}
				<div
					class="relative cursor-pointer scroll-my-2 rounded-full pr-2 pl-8
        data-[highlighted]:bg-gray-300 data-[highlighted]:text-gray-900
				dark:data-[highlighted]:bg-neutral-600 dark:data-[highlighted]:text-white
          data-[disabled]:opacity-50
          data-[selected]:bg-[var(--primary-500)] data-[selected]:text-white
          dark:data-[selected]:bg-[var(--primary-500)] dark:data-[selected]:text-white"
					use:melt={$option({ value: dropdownOption.value, label: dropdownOption.display })}
				>
					<div class="check {$isSelected(dropdownOption.value) ? 'block' : 'hidden'}">
						<Icon name="checkCircle" width="18" height="18" />
					</div>
					{dropdownOption.display}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.input.multiselect-padding {
		padding: 0.125rem 0.25rem;
	}
	.input.round {
		border-radius: 9999px;
	}

	.chip {
		padding: 0 0.5rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		line-height: 1.25rem;
		font-weight: 600;
		color: var(--text-dark);
		background-color: var(--primary-500);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 96px;
	}

	.check {
		position: absolute;
		left: 0.5rem;
		top: 50%;
		z-index: 20;
		translate: 0 -50%;
	}
</style>
