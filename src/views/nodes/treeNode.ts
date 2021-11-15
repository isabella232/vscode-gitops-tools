import { KubernetesObject } from '@kubernetes/client-node';
import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { asAbsolutePath } from '../../extensionContext';
import { createMarkdownTable, KnownTreeNodes } from '../../utils/stringUtils';

/**
 * Defines tree view item base class used by all GitOps tree views.
 */
export class TreeNode extends TreeItem {

	resource?: KnownTreeNodes | KubernetesObject;

	/**
	 * Reference to the parent node (if exists).
	 */
	parent: TreeNode | undefined;

	/**
	 * Reference to all the child nodes.
	 */
	children: TreeNode[] = [];

	/**
	 * Creates new tree node.
	 * @param label Tree node label
	 */
	constructor(label: string) {
		super(label, TreeItemCollapsibleState.None);
	}

	/**
	 * Collapses tree node and hides its children.
	 */
	makeCollapsible() {
		this.collapsibleState = TreeItemCollapsibleState.Collapsed;
	}

	/**
	 * Expands a tree node and shows its children.
	 */
	expand() {
		this.collapsibleState = TreeItemCollapsibleState.Expanded;
	}

	/**
	 * Sets tree view item icon.
	 *
	 * When passing a string - pick an item from a
	 * relative file path `resouces/icons/(dark|light)/${icon}.svg`
	 * @param icon Theme icon, uri or light/dark svg icon path.
	 */
	setIcon(icon: string | ThemeIcon | Uri) {
		if (typeof icon === 'string') {
			this.iconPath = {
				light: asAbsolutePath(`resources/icons/light/${icon}.svg`),
				dark: asAbsolutePath(`resources/icons/dark/${icon}.svg`),
			};
		} else {
			this.iconPath = icon;
		}
	}

	/**
	 * Add new tree view item to the children collection.
	 * @param child Child tree view item to add.
	 * @returns Updated tree view itme with added child.
	 */
	addChild(child: TreeNode) {
		this.children.push(child);
		child.parent = this;
		if (this.children.length) {
			// update collapse/expand state
			if (this.collapsibleState !== TreeItemCollapsibleState.Expanded) {
				this.makeCollapsible();
			}
		}
		return this;
	}

	/**
	 *
	 * VSCode doesn't support multiple contexts on the Tree Nodes, only string.
	 *
	 * Transform array to string:
	 *
	 * ```ts
	 * joinContexts('', 'one', 'two') // 'one;two;'
	 * ```
	 *
	 * @param contexts contexts for the tree node
	 */
	joinContexts(...contexts: string[]): string {
		return contexts.filter(context => context.length)
			.map(context => `${context};`)
			.join('');
	}

	// @ts-ignore
	get tooltip() {
		if (this.resource) {
			return createMarkdownTable(this.resource as KnownTreeNodes);
		}
	}
}
