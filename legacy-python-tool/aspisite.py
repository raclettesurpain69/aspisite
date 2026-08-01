import os
import zipfile
from tkinter import *
from tkinter import messagebox
from pywebcopy import save_website
import pyfiglet

def copier_site():
    url = entry_url.get()
    if not url:
        messagebox.showerror("Erreur", "Merci d'entrer un URL")
        return

    dossier = "site_copie"
    if os.path.exists(dossier):
        import shutil
        shutil.rmtree(dossier)

    try:
        save_website(
            url=url,
            project_folder=dossier,
            open_in_browser=False,
            delay=1
        )
    except Exception as e:
        messagebox.showerror("Erreur", f"Erreur lors de la copie : {e}")
        return

    zip_name = "site_copie.zip"
    with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(dossier):
            for file in files:
                file_path = os.path.join(root, file)
                zipf.write(file_path, os.path.relpath(file_path, dossier))

    messagebox.showinfo("Succès", f"Site copié et sauvegardé dans {zip_name}")

root = Tk()
root.title("AspiSite")

# Générer le titre ASCII art
ascii_art = pyfiglet.figlet_format("AspiSite")

label_titre = Label(root, text=ascii_art, font=("Courier", 14), justify=LEFT)
label_titre.pack(pady=10)

Label(root, text="Entrez l'URL du site à copier :").pack(pady=5)
entry_url = Entry(root, width=50)
entry_url.pack(pady=5)

btn_copier = Button(root, text="Copier le site", command=copier_site)
btn_copier.pack(pady=20)

root.mainloop()
