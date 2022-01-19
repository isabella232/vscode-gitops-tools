import { window } from 'vscode';
import { AzureClusterProvider, azureTools, isAzureProvider } from '../azure/azureTools';
import { failed } from '../errorable';
import { telemetry } from '../extension';
import { fluxTools } from '../flux/fluxTools';
import { FluxSource } from '../flux/fluxTypes';
import { checkIfOpenedFolderGitRepositorySourceExists } from '../git/checkIfOpenedFolderGitRepositorySourceExists';
import { KubernetesObjectKinds } from '../kubernetes/kubernetesTypes';
import { TelemetryEventNames } from '../telemetry';
import { BucketNode } from '../views/nodes/bucketNode';
import { GitRepositoryNode } from '../views/nodes/gitRepositoryNode';
import { HelmRepositoryNode } from '../views/nodes/helmRepositoryNode';
import { getCurrentClusterInfo, refreshSourcesTreeView, refreshWorkloadsTreeView } from '../views/treeViews';

/**
 * Delete a source
 *
 * @param sourceNode Sources tree view node
 */
export async function deleteSource(sourceNode: GitRepositoryNode | HelmRepositoryNode | BucketNode) {

	const sourceName = sourceNode.resource.metadata.name || '';
	const sourceNamespace = sourceNode.resource.metadata.namespace || '';
	const confirmButton = 'Delete';

	const sourceType: FluxSource | 'unknown' = sourceNode.resource.kind === KubernetesObjectKinds.GitRepository ? 'source git' :
		sourceNode.resource.kind === KubernetesObjectKinds.HelmRepository ? 'source helm' :
			sourceNode.resource.kind === KubernetesObjectKinds.Bucket ? 'source bucket' : 'unknown';

	if (sourceType === 'unknown') {
		window.showErrorMessage(`Unknown Source resource kind ${sourceNode.resource.kind}`);
		return;
	}

	const confirm = await window.showWarningMessage(`Do you want to delete ${sourceType} "${sourceName}"?`, {
		modal: true,
	}, confirmButton);
	if (!confirm) {
		return;
	}

	telemetry.send(TelemetryEventNames.DeleteSource, {
		kind: sourceNode.resource.kind,
	});

	const currentClusterInfo = await getCurrentClusterInfo();
	if (failed(currentClusterInfo)) {
		return;
	}

	if (currentClusterInfo.result.isAzure) {
		await azureTools.deleteSource(sourceName, currentClusterInfo.result.contextName, currentClusterInfo.result.clusterProvider as AzureClusterProvider);
		refreshWorkloadsTreeView();
	} else {
		await fluxTools.deleteSource(sourceType, sourceName, sourceNamespace);
	}

	refreshSourcesTreeView();

	if (sourceType === 'source git') {
		checkIfOpenedFolderGitRepositorySourceExists();
	}
}
