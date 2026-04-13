Shader "Custom/SpriteSilhouette"
{
    Properties
    {
        _MainTex ("Sprite Texture", 2D) = "white" {}
        _Color ("Silhouette Color", Color) = (0.1, 0.05, 0.02, 1)
        _AlphaCutoff ("Alpha Cutoff", Range(0, 1)) = 0.5
        _Expand ("Outline Expand (world units)", Float) = 0.02
        _Erode ("Erode (pixels)", Range(0, 5)) = 2
    }
    SubShader
    {
        Tags
        {
            "Queue" = "Transparent"
            "RenderType" = "Transparent"
            "IgnoreProjector" = "True"
            "PreviewType" = "Plane"
            "CanUseSpriteAtlas" = "True"
        }

        Cull Off
        Lighting Off
        ZWrite Off
        Blend SrcAlpha OneMinusSrcAlpha

        Pass
        {
            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #include "UnityCG.cginc"

            struct appdata
            {
                float4 vertex : POSITION;
                float2 uv : TEXCOORD0;
            };

            struct v2f
            {
                float4 pos : SV_POSITION;
                float2 uv : TEXCOORD0;
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;
            float4 _MainTex_TexelSize;
            fixed4 _Color;
            float _AlphaCutoff;
            float _Expand;
            float _Erode;

            v2f vert(appdata v)
            {
                v2f o;
                float2 dir = v.vertex.xy;
                float len = length(dir);
                float2 push = len > 0.001 ? (dir / len) * _Expand : float2(0, 0);
                float4 expanded = v.vertex;
                expanded.xy += push;

                o.pos = UnityObjectToClipPos(expanded);
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
                return o;
            }

            fixed4 frag(v2f i) : SV_Target
            {
                float2 px = _MainTex_TexelSize.xy * _Erode;

                // Érosion : le pixel n'est valide que si LUI ET tous ses
                // voisins proches ont de l'alpha. Un pixel isolé est éliminé.
                float minAlpha = tex2D(_MainTex, i.uv).a;
                minAlpha = min(minAlpha, tex2D(_MainTex, i.uv + float2( 1,  0) * px).a);
                minAlpha = min(minAlpha, tex2D(_MainTex, i.uv + float2(-1,  0) * px).a);
                minAlpha = min(minAlpha, tex2D(_MainTex, i.uv + float2( 0,  1) * px).a);
                minAlpha = min(minAlpha, tex2D(_MainTex, i.uv + float2( 0, -1) * px).a);
                minAlpha = min(minAlpha, tex2D(_MainTex, i.uv + float2( 1,  1) * px).a);
                minAlpha = min(minAlpha, tex2D(_MainTex, i.uv + float2(-1,  1) * px).a);
                minAlpha = min(minAlpha, tex2D(_MainTex, i.uv + float2( 1, -1) * px).a);
                minAlpha = min(minAlpha, tex2D(_MainTex, i.uv + float2(-1, -1) * px).a);

                clip(minAlpha - _AlphaCutoff);
                return _Color;
            }
            ENDCG
        }
    }
}
