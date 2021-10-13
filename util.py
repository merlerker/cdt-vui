from os import listdir
from os.path import isfile, join

## Folder names
# mypath = '/Users/Malika/Documents/CMU/21F/CDT/cdt-vui/ui_flow/assets/PNGS'
# onlyfolders= [f for f in listdir(mypath) if not (isfile(join(mypath, f)))]
# print(onlyfolders) # ['loading', 'read', 'listen', 'encourage', 'celebrate', 'teach', 'TRANSITIONS', 'help', 'hello-goodbye']

# Dictionary of folder names & number of files
# mypath = '/Users/Malika/Documents/CMU/21F/CDT/cdt-vui/ui_flow/assets/PNGS/TRANSITIONS'
# mypath = '/Users/Malika/Documents/CMU/21F/CDT/cdt-vui/ui_flow/assets/PNGS'
# folder_file_count = {}
# for f in listdir(mypath):
#     # for each folder in the directory, count what it contains
#     if not (isfile(join(mypath, f))):
#         folder_name = f
#         files = listdir(join(mypath, f))
#         folder_file_count[f] = len(files)
# print(folder_file_count)


# words = "chug chug chug puff puff puff ding-dong ding-dong the little train rumbled over the tracks she was a happy little train"
# print(words.split())

from PIL import Image
import PIL

mypath = '/Users/Malika/Documents/CMU/21F/CDT/cdt-vui/ui_flow/assets/PNGS'
for f in listdir(mypath):
    subpath = join(mypath, f)
    # it's a png
    if (isfile(subpath) and f[-4:len(f)]=='.png'):
        fixed_height = 350 # the dimension we want
        image = Image.open(subpath)
        height_percent = (fixed_height / float(image.size[1]))
        width_size = int((float(image.size[0]) * float(height_percent)))
        image = image.resize((width_size, fixed_height), PIL.Image.NEAREST)
        image.save(f)
    # for each folder in the directory, count what it contains
    if not (isfile(join(mypath, f))):
        folder_name = f
        files = listdir(join(mypath, f))
        folder_file_count[f] = len(files)
print(folder_file_count)