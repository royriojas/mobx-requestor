#!/bin/bash

# transitively remove minimatch types from node_modules @types/minimatch and minimatch

find node_modules -type d -path "*/@types/minimatch" -exec rm -rf {} +
