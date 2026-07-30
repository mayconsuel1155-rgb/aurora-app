import os
try:
    from pywebpush import webpush, WebPusher
    import base64
    import json
    
    # Gerando VAPID Keys. O pywebpush não tem gerador embutido no código trivialmente sem usar linha de comando.
    # Vou usar o script ec256 da internet ou sugerir usar online.
    print("Execute: vapid --gen")
except ImportError:
    print("pywebpush not installed locally. Run: pip install pywebpush")
