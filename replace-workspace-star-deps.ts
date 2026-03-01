import { Glob } from "bun";
// using bun let's make a script that will traverse all the package.json files 
// in the monorepo and replace the workspace:* dependencies with the actual versions 
// of the packages in the workspace

const main = async () => {
  // get all package.json files in the monorepo
  const glob = new Glob("**/*/package.json");
  const scannedFiles = await Array.fromAsync(glob.scan({ cwd: './packages' }))
  
  const pkgEntries = await Promise.all(scannedFiles.map(async (file) => {
    const content = JSON.parse(await Bun.file(file).text());
    return { file, content } as const;
  }))
  
  const workspacePackages = pkgEntries.reduce((acc, { file, content }) => {
    const name = content.name;
    const version = content.version;
    acc.set(name, version);
    return acc;
  }, new Map<string, string>())
  
  for (const { file, content } of pkgEntries) {
    await replaceWorkspaceStarDeps(file, content, workspacePackages);
  }
};

const replaceWorkspaceStarDeps = async (file: string, content: any, workspacePackages: Map<string, string>) => {
  // Do this on dependencies, peerDependencies and devDependencies
  const deps = ['dependencies', 'peerDependencies', 'devDependencies', 'optionalDependencies'];
  for (const dep of deps) {
    const dependencies = content[dep];
    if (!dependencies) continue;
    for (const [name, version] of workspacePackages) {
      if (dependencies[name] === 'workspace:*') {
        dependencies[name] = version;
      }
    }
  }
  await Bun.write(file, JSON.stringify(content, null, 2));
}

main().catch((error) => console.error(error));