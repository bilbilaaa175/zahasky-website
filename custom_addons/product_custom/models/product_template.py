# -*- coding: utf-8 -*-
from odoo import models, fields

class ProductTemplate(models.Model):
    _inherit = 'product.template'

    x_product_description = fields.Text(string='Deskripsi Produk Custom')
    x_digital_file_url = fields.Char(string='Link Google Drive / File Digital')
    x_product_type = fields.Char(string='Tipe Produk')
    x_series = fields.Char(string='Seri Produk')
    x_designer_name = fields.Char(string='Nama Desainer')
    x_designer_role = fields.Char(string='Peran Desainer')
    x_file_format = fields.Char(string='Format File (ZIP/PDF/dll)')
    x_file_size = fields.Char(string='Ukuran File')
    x_stock = fields.Integer(string='Stok Kustom', default=0)
