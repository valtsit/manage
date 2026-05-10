import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from './utils/auth';
import AppLayout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductLinks from './pages/ProductLinks';
import ProductLinkForm from './pages/ProductLinkForm';
import Inventory from './pages/Inventory';
import RawMaterials from './pages/RawMaterials';
import RawMaterialForm from './pages/RawMaterialForm';
import Consumables from './pages/Consumables';
import ConsumableForm from './pages/ConsumableForm';
import Labels from './pages/Labels';
import LabelForm from './pages/LabelForm';
import CostAnalysis from './pages/CostAnalysis';
import Users from './pages/Users';

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="product-links" element={<ProductLinks />} />
          <Route path="product-links/new" element={<ProductLinkForm />} />
          <Route path="product-links/:id/edit" element={<ProductLinkForm />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="raw-materials" element={<RawMaterials />} />
          <Route path="raw-materials/new" element={<RawMaterialForm />} />
          <Route path="raw-materials/:id/edit" element={<RawMaterialForm />} />
          <Route path="consumables" element={<Consumables />} />
          <Route path="consumables/new" element={<ConsumableForm />} />
          <Route path="consumables/:id/edit" element={<ConsumableForm />} />
          <Route path="labels" element={<Labels />} />
          <Route path="labels/new" element={<LabelForm />} />
          <Route path="labels/:id/edit" element={<LabelForm />} />
          <Route path="cost" element={<CostAnalysis />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
