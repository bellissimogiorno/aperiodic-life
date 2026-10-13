"""Run one miner campaign and retain exact command, exit status and resource use."""
import json
import resource
import subprocess
import sys
import time
from pathlib import Path

command = sys.argv[1:]
prefix = command[3]
started = time.time()
with open(prefix + '.stdout', 'w') as output, open(prefix + '.log', 'w') as error:
    result = subprocess.run(command, stdout=output, stderr=error)
usage = resource.getrusage(resource.RUSAGE_CHILDREN)
Path(prefix + '-resource.json').write_text(json.dumps({
    'command': command, 'exitCode': result.returncode,
    'elapsedSeconds': time.time() - started,
    'userCpuSeconds': usage.ru_utime, 'systemCpuSeconds': usage.ru_stime,
    'maximumResidentKiB': usage.ru_maxrss,
}, indent=2) + '\n')
sys.exit(result.returncode)
