import urllib.request
try:
    urllib.request.urlopen("https://github.com/dayashimoga/pomodoro-timer")
    print("Repo exists (200)")
except Exception as e:
    print("Repo failed: " + str(e))
