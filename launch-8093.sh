#!/bin/bash
cd /home/hermes/vps-anatomy/backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8093 2>&1 | tee /tmp/vps-anatomy.log
