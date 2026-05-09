import os

def collect_files(root_dir, output_file):
    exclude_dirs = {'.git', 'node_modules', 'dist', 'build', '.next'}
    exclude_files = {'package-lock.json', 'interntrackallfiles.tsx', 'structure.txt'}
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file in exclude_files:
                    continue
                
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, root_dir)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        content = infile.read()
                        outfile.write(f"\n\n// --- FILE: {rel_path} ---\n\n")
                        outfile.write(content)
                except Exception as e:
                    outfile.write(f"\n\n// --- ERROR READING FILE: {rel_path} ({str(e)}) ---\n\n")

if __name__ == "__main__":
    collect_files('.', 'interntrackallfiles.tsx')
